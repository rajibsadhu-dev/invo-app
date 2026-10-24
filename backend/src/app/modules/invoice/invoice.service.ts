import crypto from "crypto";
import fs from "fs";
import path from "path";
import httpStatus from "http-status";
import { Prisma, InvoiceStatus, OrgRole, Customer, Organization } from "@prisma/client";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import config from "@/config";
import ApiError from "@/app/errors/ApiError";
import { amountInWords } from "@/helpers/amountInWords";
import { computeInvoiceTotals, dec, money, GstLineInput } from "@/helpers/gst";
import { buildQuery, paginationMeta } from "@/helpers/queryBuilder";
import { buildInvoiceHtml } from "@/helpers/invoicePdfTemplate";
import { generateInvoicePdf } from "@/helpers/pdfGenerator";
import { sendMailWithAttachment } from "@/helpers/mailer";
import { logEmail } from "@/helpers/emailLogger";
import { ICreateInvoice, IUpdateInvoice, IInvoiceQuery } from "./invoice.interface";
import { InventoryService } from "@/app/modules/inventory/inventory.service";

const INVOICE_FILTER_FIELDS = [
  "invoiceNumber",
  "status",
  "grandTotal",
  "subtotal",
  "receivedAmount",
  "invoiceDate",
  "customerId",
  "createdById",
  "paymentMethod",
  "challanNo",
  "vehicleNo",
  "siteLocation",
  "referenceNumber",
  "createdAt",
];

const INVOICE_SORT_FIELDS = [
  "invoiceNumber",
  "invoiceDate",
  "grandTotal",
  "status",
  "createdAt",
  "subtotal",
  "receivedAmount",
];

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
const findInvoice = async (
  organizationId: number,
  invoiceId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
      deletedAt: null,
      ...(orgRole === "staff" && userId ? { createdById: userId } : {}),
    },
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

/**
 * A line may cite a catalogue product and optionally a specific variant. Anything not in
 * this organization's catalogue is refused rather than stored: a foreign id would put
 * another business's product on this invoice, and the FK alone cannot tell the two apart.
 * Variants must belong to their cited product.
 */
const assertProductsInOrg = async (
  tx: Prisma.TransactionClient,
  organizationId: number,
  lines: GstLineInput[]
): Promise<void> => {
  const productIds = [
    ...new Set(
      lines
        .map((line) => line.productId)
        .filter((id): id is number => typeof id === "number")
    ),
  ];
  if (productIds.length > 0) {
    const found = await tx.product.count({
      where: { id: { in: productIds }, organizationId },
    });
    if (found !== productIds.length) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "One or more products on this invoice were not found in this organization"
      );
    }
  }

  const variantLines = lines.filter(
    (l): l is GstLineInput & { productVariantId: number } =>
      typeof l.productVariantId === "number"
  );
  if (variantLines.length > 0) {
    const variantIds = [...new Set(variantLines.map((l) => l.productVariantId))];
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, productId: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v.productId]));

    for (const line of variantLines) {
      const ownerProductId = variantMap.get(line.productVariantId);
      if (ownerProductId === undefined) {
        throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
      }
      if (line.productId && ownerProductId !== line.productId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Variant does not belong to the specified product"
        );
      }
    }
  }
};

const toLineInputs = (items: ICreateInvoice["items"]): GstLineInput[] =>
  items.map((item) => ({
    description: item.description,
    productId: item.productId ?? null,
    productVariantId: item.productVariantId ?? null,
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

const createInvoice = async (organizationId: number, payload: ICreateInvoice, createdById: number) => {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: payload.customerId, organizationId },
    });
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");

    const lines = toLineInputs(payload.items);
    await assertProductsInOrg(tx, organizationId, lines);
    const hasGst = lines.some((l) => Number(l.gstRate ?? 0) > 0);

    // Reserve the number by incrementing first and using what comes back. Reading the
    // counter and incrementing afterwards let two concurrent creates read the same value.
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const sequence = org.nextInvoiceNumber - 1;
    const invoiceNumber = `${org.invoicePrefix}-${String(sequence).padStart(4, "0")}`;

    const fieldConfig = (org.invoiceFieldConfig as Record<string, boolean> | null) ?? {};
    const verificationToken = fieldConfig.qrVerification ? crypto.randomUUID() : undefined;

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
        createdById,
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
        verificationToken,
        ...pickOptionalFields(payload),
        items: { create: totals.lines },
      },
      include: { items: true, customer: true },
    });

    return addBalanceDue(invoice);
  });
};

const getInvoices = async (organizationId: number, query: IInvoiceQuery) => {
  const { search, orgRole: memberRole, userId } = query;

  const baseWhere: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
    ...(memberRole === "staff" && userId ? { createdById: userId } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search } },
            { customer: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const { where, orderBy, skip, take, page, limit } = buildQuery({
    filters: query.filters,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    allowedFields: INVOICE_FILTER_FIELDS,
    allowedSortFields: INVOICE_SORT_FIELDS,
    defaultSort: "invoiceDate",
    defaultOrder: "desc",
    baseWhere,
  });

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data: data.map(addBalanceDue),
    meta: paginationMeta(total, page, limit),
  };
};

const getInvoiceById = async (
  organizationId: number,
  invoiceId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  return addBalanceDue(await findInvoice(organizationId, invoiceId, orgRole, userId));
};

const updateInvoice = async (
  organizationId: number,
  invoiceId: number,
  payload: IUpdateInvoice,
  orgRole?: OrgRole,
  userId?: number
) => {
  const existing = await findInvoice(organizationId, invoiceId, orgRole, userId);

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
          productId: item.productId,
          hsnCode: item.hsnCode,
          unit: item.unit,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          gstRate: Number(item.gstRate),
        }));

      const lines = toLineInputs(sourceItems);
      await assertProductsInOrg(tx, organizationId, lines);
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

    // ── Stock deduction / reversal on status transition ──────────────────
    if (payload.status !== undefined && payload.status !== existing.status && userId) {
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { deductStockOn: true },
      });

      const triggerStatus = org.deductStockOn === "created" ? "draft" : "sent";

      if (payload.status === triggerStatus || payload.status === "paid") {
        const alreadyDeducted = await tx.stockMovement.count({
          where: { referenceType: "invoice", referenceId: invoiceId, type: "sale" },
        });
        if (alreadyDeducted === 0) {
          await InventoryService.deductStockForInvoice(
            tx,
            organizationId,
            invoiceId,
            updated.items.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
            })),
            userId
          );
        }
      }

      if (payload.status === "cancelled") {
        await InventoryService.reverseStockForInvoice(
          tx,
          organizationId,
          invoiceId,
          userId
        );
      }
    }

    return addBalanceDue(updated);
  });
};

/**
 * Soft delete. An invoice is a financial record: it is withdrawn from the working set but
 * its number stays reserved, so it can never be silently reused by a later document.
 */
const deleteInvoice = async (
  organizationId: number,
  invoiceId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const invoice = await findInvoice(organizationId, invoiceId, orgRole, userId);

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

const getInvoiceByVerificationToken = async (token: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { verificationToken: token },
    include: {
      items: true,
      customer: true,
      organization: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          logo: true,
          registerNumber: true,
          gstNumber: true,
          stateCode: true,
          businessType: true,
        },
      },
    },
  });

  if (!invoice || invoice.deletedAt) return null;

  return addBalanceDue(invoice);
};

const getInvoiceForSend = async (
  organizationId: number,
  invoiceId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId,
      deletedAt: null,
      ...(orgRole === "staff" && userId ? { createdById: userId } : {}),
    },
    include: {
      items: true,
      customer: true,
      organization: {
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          logo: true,
          registerNumber: true,
          gstNumber: true,
          stateCode: true,
          businessType: true,
        },
      },
    },
  });
  if (!invoice) throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
  return addBalanceDue(invoice);
};

const sendInvoice = async (
  organizationId: number,
  invoiceId: number,
  payload: { to: string; subject: string; message: string },
  userId: number,
  orgRole?: OrgRole
) => {
  const invoice = await getInvoiceForSend(organizationId, invoiceId, orgRole, userId);
  const org = invoice.organization;

  // Read logo from disk as base64 data URL
  let logoBase64: string | null = null;
  if (org.logo) {
    try {
      const logoPath = path.join(process.cwd(), org.logo);
      const logoBuffer = fs.readFileSync(logoPath);
      const ext = path.extname(org.logo).toLowerCase().replace(".", "");
      const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
      logoBase64 = `data:${mime};base64,${logoBuffer.toString("base64")}`;
    } catch {
      // Logo file missing — proceed without it
    }
  }

  // Generate QR data URL if verification token exists
  let qrDataUrl: string | null = null;
  if (invoice.verificationToken) {
    const origin = config.cors_origins?.[0] || `http://localhost:${config.port}`;
    const verifyUrl = `${origin}/verify/${invoice.verificationToken}`;
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  }

  // Build HTML and generate PDF
  const html = buildInvoiceHtml({ invoice, org, logoBase64, qrDataUrl });
  const pdfBuffer = await generateInvoicePdf(html);

  // Attempt SMTP send (non-fatal on failure)
  let smtpSent = false;
  try {
    smtpSent = await sendMailWithAttachment({
      to: payload.to,
      subject: payload.subject,
      html: `<div style="font-family:sans-serif;">${payload.message.replace(/\n/g, "<br>")}</div>`,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch {
    // SMTP failure is non-fatal — email is logged regardless
  }

  // Always log to email-log.txt
  logEmail({
    orgName: org.name,
    to: payload.to,
    subject: payload.subject,
    body: payload.message,
    attachmentName: `${invoice.invoiceNumber}.pdf`,
    attachmentSizeKb: Math.round(pdfBuffer.length / 1024),
    smtpSent,
  });

  // Auto-transition draft → sent
  if (invoice.status === "draft") {
    return InvoiceService.updateInvoice(
      organizationId,
      invoiceId,
      { status: "sent" as InvoiceStatus },
      orgRole,
      userId
    );
  }

  return addBalanceDue(invoice);
};

export const InvoiceService = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getInvoiceByVerificationToken,
  sendInvoice,
};
