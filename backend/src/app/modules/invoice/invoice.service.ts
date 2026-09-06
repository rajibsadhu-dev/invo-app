import httpStatus from "http-status";
import { Prisma, InvoiceStatus, Customer, Organization } from "@prisma/client";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { amountInWords } from "@/helpers/amountInWords";
import { computeInvoiceTotals, dec, money, GstLineInput } from "@/helpers/gst";
import { ICreateInvoice, IUpdateInvoice, IInvoiceQuery } from "./invoice.interface";

const MAX_PAGE_SIZE = 100;

/**
 * Permitted status moves. `paid` and `cancelled` are terminal: a settled or withdrawn
 * invoice is superseded by a new document, never edited back into life.
 */
const ALLOWED_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

/** Fields that stay editable after an invoice has been issued. */
const POST_ISSUE_EDITABLE = new Set([
  "status",
  "receivedAmount",
  "paymentMethod",
  "bankName",
  "bankAccount",
  "bankIfsc",
  "transactionNumber",
  "notes",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const addBalanceDue = <
  T extends { grandTotal: Prisma.Decimal; receivedAmount: Prisma.Decimal },
>(
  invoice: T
) => ({
  ...invoice,
  balanceDue: money(dec(invoice.grandTotal).minus(dec(invoice.receivedAmount))),
});

/** Soft-deleted invoices are withdrawn from every read path. */
const findInvoice = async (organizationId: number, invoiceId: number) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId, deletedAt: null },
    include: { items: true, customer: true },
  });
  if (!invoice) throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  return invoice;
};

/**
 * Place of supply decides CGST+SGST (same state) versus IGST (across states). Getting it
 * wrong misfiles the tax, so a GST-rated invoice cannot be raised until both state codes
 * are known — guessing a default here would silently produce wrong returns.
 */
const resolvePlaceOfSupply = (
  org: Organization,
  customer: Customer,
  hasGst: boolean
) => {
  if (!hasGst) {
    return { placeOfSupply: customer.stateCode ?? null, isIntraState: true };
  }

  if (!org.stateCode) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Set the organization's GST state code before raising a GST invoice"
    );
  }
  if (!customer.stateCode) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Set the customer's GST state code before raising a GST invoice"
    );
  }

  return {
    placeOfSupply: customer.stateCode,
    isIntraState: org.stateCode === customer.stateCode,
  };
};

const toLineInputs = (items: ICreateInvoice["items"]): GstLineInput[] =>
  items.map((item) => ({
    description: item.description,
    hsnCode: item.hsnCode || null,
    unit: item.unit ?? null,
    quantity: item.quantity,
    rate: item.rate,
    gstRate: item.gstRate ?? 0,
  }));

const assertMoneyConsistent = (opts: {
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  receivedAmount: Prisma.Decimal;
  status: InvoiceStatus;
}) => {
  if (opts.discount.greaterThan(opts.subtotal)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Discount cannot exceed the invoice subtotal"
    );
  }
  if (opts.receivedAmount.greaterThan(opts.grandTotal)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Received amount cannot exceed the invoice total"
    );
  }
  if (opts.status === "paid" && opts.receivedAmount.lessThan(opts.grandTotal)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "An invoice cannot be marked paid while a balance is outstanding"
    );
  }
};

const pickOptionalFields = (payload: ICreateInvoice | IUpdateInvoice) => ({
  ...(payload.invoiceDate !== undefined && {
    invoiceDate: new Date(payload.invoiceDate),
  }),
  ...(payload.challanNo !== undefined && { challanNo: payload.challanNo }),
  ...(payload.vehicleNo !== undefined && { vehicleNo: payload.vehicleNo }),
  ...(payload.siteLocation !== undefined && { siteLocation: payload.siteLocation }),
  ...(payload.billingAddress !== undefined && {
    billingAddress: payload.billingAddress,
  }),
  ...(payload.referenceNumber !== undefined && {
    referenceNumber: payload.referenceNumber,
  }),
  ...(payload.paymentMethod !== undefined && {
    paymentMethod: payload.paymentMethod,
  }),
  ...(payload.bankName !== undefined && { bankName: payload.bankName }),
  ...(payload.bankAccount !== undefined && { bankAccount: payload.bankAccount }),
  ...(payload.bankIfsc !== undefined && { bankIfsc: payload.bankIfsc }),
  ...(payload.transactionNumber !== undefined && {
    transactionNumber: payload.transactionNumber,
  }),
  ...(payload.termsAndConditions !== undefined && {
    termsAndConditions: payload.termsAndConditions,
  }),
  ...(payload.notes !== undefined && { notes: payload.notes }),
  ...(payload.authorizedSignatory !== undefined && {
    authorizedSignatory: payload.authorizedSignatory,
  }),
});

// ─── Service ──────────────────────────────────────────────────────────────────

const createInvoice = async (organizationId: number, payload: ICreateInvoice) => {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: payload.customerId, organizationId },
    });
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");

    const lines = toLineInputs(payload.items);
    const hasGst = lines.some((l) => Number(l.gstRate ?? 0) > 0);

    // Reserve the number by incrementing first and using what comes back. Reading the
    // counter and incrementing afterwards let two concurrent creates read the same value.
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const sequence = org.nextInvoiceNumber - 1;
    const invoiceNumber = `${org.invoicePrefix}-${String(sequence).padStart(4, "0")}`;

    const { placeOfSupply, isIntraState } = resolvePlaceOfSupply(
      org,
      customer,
      hasGst
    );

    const totals = computeInvoiceTotals(lines, {
      discount: payload.discount ?? 0,
      isIntraState,
    });
    const receivedAmount = money(payload.receivedAmount ?? 0);

    assertMoneyConsistent({
      subtotal: totals.subtotal,
      discount: totals.discount,
      grandTotal: totals.grandTotal,
      receivedAmount,
      status: "draft",
    });

    const invoice = await tx.invoice.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        invoiceNumber,
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxableValue: totals.taxableValue,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        igstTotal: totals.igstTotal,
        tax: totals.tax,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        receivedAmount,
        placeOfSupply,
        isIntraState,
        amountInWords: amountInWords(totals.grandTotal),
        ...pickOptionalFields(payload),
        items: { create: totals.lines },
      },
      include: { items: true, customer: true },
    });

    return addBalanceDue(invoice);
  });
};

const getInvoices = async (organizationId: number, query: IInvoiceQuery) => {
  const {
    status,
    customerId,
    search,
    fromDate,
    toDate,
    page = 1,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = query;

  const limit = Math.min(Math.max(query.limit ?? 10, 1), MAX_PAGE_SIZE);
  const currentPage = Math.max(page, 1);

  const where: Prisma.InvoiceWhereInput = {
    organizationId,
    deletedAt: null,
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...((fromDate || toDate) && {
      invoiceDate: {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      },
    }),
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ],
    }),
  };

  const allowedSortFields = [
    "invoiceNumber",
    "invoiceDate",
    "grandTotal",
    "status",
    "createdAt",
  ];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "invoiceDate";

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { [orderByField]: sortOrder },
      skip: (currentPage - 1) * limit,
      take: limit,
      // Line items are not rendered in the list — fetching them multiplied the payload
      // by the number of lines on every page load for nothing.
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data: data.map(addBalanceDue),
    meta: {
      total,
      page: currentPage,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getInvoiceById = async (organizationId: number, invoiceId: number) => {
  return addBalanceDue(await findInvoice(organizationId, invoiceId));
};

const updateInvoice = async (
  organizationId: number,
  invoiceId: number,
  payload: IUpdateInvoice
) => {
  const existing = await findInvoice(organizationId, invoiceId);

  // Once issued, an invoice's figures are fixed. Only settlement details may still move.
  if (existing.status !== "draft") {
    const attempted = Object.keys(payload).filter(
      (key) => payload[key as keyof IUpdateInvoice] !== undefined
    );
    const blocked = attempted.filter((key) => !POST_ISSUE_EDITABLE.has(key));
    if (blocked.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `An invoice that is ${existing.status} cannot have these fields changed: ${blocked.join(", ")}`
      );
    }
  }

  if (payload.status !== undefined && payload.status !== existing.status) {
    if (!ALLOWED_TRANSITIONS[existing.status].includes(payload.status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot change invoice status from ${existing.status} to ${payload.status}`
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updateData: Prisma.InvoiceUpdateInput = { ...pickOptionalFields(payload) };

    let customer: Customer = existing.customer;
    if (payload.customerId !== undefined && payload.customerId !== existing.customerId) {
      const next = await tx.customer.findFirst({
        where: { id: payload.customerId, organizationId },
      });
      if (!next) throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
      customer = next;
      updateData.customer = { connect: { id: payload.customerId } };
    }

    if (payload.status !== undefined) updateData.status = payload.status;

    const status = payload.status ?? existing.status;
    const receivedAmount =
      payload.receivedAmount !== undefined
        ? money(payload.receivedAmount)
        : dec(existing.receivedAmount);
    if (payload.receivedAmount !== undefined) {
      updateData.receivedAmount = receivedAmount;
    }

    // Recompute whenever anything the figures depend on has moved.
    const recalculate =
      payload.items !== undefined ||
      payload.discount !== undefined ||
      payload.customerId !== undefined;

    let subtotal = dec(existing.subtotal);
    let discount = dec(existing.discount);
    let grandTotal = dec(existing.grandTotal);

    if (recalculate) {
      const sourceItems =
        payload.items ??
        existing.items.map((item) => ({
          description: item.description,
          hsnCode: item.hsnCode,
          unit: item.unit,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          gstRate: Number(item.gstRate),
        }));

      const lines = toLineInputs(sourceItems);
      const hasGst = lines.some((l) => Number(l.gstRate ?? 0) > 0);

      const org = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
      });
      const { placeOfSupply, isIntraState } = resolvePlaceOfSupply(
        org,
        customer,
        hasGst
      );

      const totals = computeInvoiceTotals(lines, {
        discount: payload.discount ?? dec(existing.discount),
        isIntraState,
      });

      subtotal = totals.subtotal;
      discount = totals.discount;
      grandTotal = totals.grandTotal;

      Object.assign(updateData, {
        subtotal: totals.subtotal,
        discount: totals.discount,
        taxableValue: totals.taxableValue,
        cgstTotal: totals.cgstTotal,
        sgstTotal: totals.sgstTotal,
        igstTotal: totals.igstTotal,
        tax: totals.tax,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        placeOfSupply,
        isIntraState,
        amountInWords: amountInWords(totals.grandTotal),
      });

      await tx.invoiceItem.deleteMany({ where: { invoiceId } });
      await tx.invoiceItem.createMany({
        data: totals.lines.map((line) => ({ ...line, invoiceId })),
      });
    }

    assertMoneyConsistent({
      subtotal,
      discount,
      grandTotal,
      receivedAmount,
      status,
    });

    const updated = await tx.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: { items: true, customer: true },
    });

    return addBalanceDue(updated);
  });
};

/**
 * Soft delete. An invoice is a financial record: it is withdrawn from the working set but
 * its number stays reserved, so it can never be silently reused by a later document.
 */
const deleteInvoice = async (organizationId: number, invoiceId: number) => {
  const invoice = await findInvoice(organizationId, invoiceId);

  if (invoice.status === "paid") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A paid invoice cannot be deleted. Cancel it instead."
    );
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { deletedAt: new Date() },
  });
};

export const InvoiceService = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
