import fs from "fs";
import path from "path";
import httpStatus from "http-status";
import { Prisma, EstimateStatus, OrgRole, Customer, Organization } from "@prisma/client";
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
import { ICreateEstimate, IUpdateEstimate, IEstimateQuery } from "./estimate.interface";

const ESTIMATE_FILTER_FIELDS = [
  "estimateNumber",
  "status",
  "grandTotal",
  "subtotal",
  "estimateDate",
  "customerId",
  "createdById",
  "challanNo",
  "vehicleNo",
  "siteLocation",
  "referenceNumber",
  "createdAt",
];

const ESTIMATE_SORT_FIELDS = [
  "estimateNumber",
  "estimateDate",
  "grandTotal",
  "status",
  "createdAt",
  "subtotal",
  "validUntil",
];

const ALLOWED_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["accepted", "rejected", "cancelled"],
  accepted: ["converted"],
  rejected: [],
  expired: [],
  converted: [],
  cancelled: [],
};

const POST_ISSUE_EDITABLE = new Set(["status", "notes", "termsAndConditions"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findEstimate = async (
  organizationId: number,
  estimateId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      organizationId,
      ...(orgRole === "staff" && userId ? { createdById: userId } : {}),
    },
    include: { items: true, customer: true },
  });
  if (!estimate) throw new ApiError(httpStatus.NOT_FOUND, "Estimate not found");
  return estimate;
};

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
      "Set the organization's GST state code before raising a GST estimate"
    );
  }
  if (!customer.stateCode) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Set the customer's GST state code before raising a GST estimate"
    );
  }

  return {
    placeOfSupply: customer.stateCode,
    isIntraState: org.stateCode === customer.stateCode,
  };
};

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
        "One or more products on this estimate were not found in this organization"
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

const toLineInputs = (items: ICreateEstimate["items"]): GstLineInput[] =>
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

const pickOptionalFields = (payload: ICreateEstimate | IUpdateEstimate) => ({
  ...(payload.estimateDate !== undefined && {
    estimateDate: new Date(payload.estimateDate as string | Date),
  }),
  ...(payload.validUntil !== undefined && {
    validUntil: payload.validUntil ? new Date(payload.validUntil as string | Date) : null,
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
  ...(payload.termsAndConditions !== undefined && {
    termsAndConditions: payload.termsAndConditions,
  }),
  ...(payload.notes !== undefined && { notes: payload.notes }),
  ...(payload.authorizedSignatory !== undefined && {
    authorizedSignatory: payload.authorizedSignatory,
  }),
});

const checkAutoExpiry = async (
  estimate: { id: number; status: EstimateStatus; validUntil: Date | null }
) => {
  if (
    estimate.status === "sent" &&
    estimate.validUntil &&
    estimate.validUntil < new Date()
  ) {
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "expired" },
    });
    return "expired" as EstimateStatus;
  }
  return estimate.status;
};

// ─── Service ──────────────────────────────────────────────────────────────────

const createEstimate = async (
  organizationId: number,
  payload: ICreateEstimate,
  createdById: number
) => {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: payload.customerId, organizationId },
    });
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");

    const lines = toLineInputs(payload.items);
    await assertProductsInOrg(tx, organizationId, lines);
    const hasGst = lines.some((l) => Number(l.gstRate ?? 0) > 0);

    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { nextEstimateNumber: { increment: 1 } },
    });

    const sequence = org.nextEstimateNumber - 1;
    const estimateNumber = `${org.estimatePrefix}-${String(sequence).padStart(4, "0")}`;

    const { placeOfSupply, isIntraState } = resolvePlaceOfSupply(
      org,
      customer,
      hasGst
    );

    const totals = computeInvoiceTotals(lines, {
      discount: payload.discount ?? 0,
      isIntraState,
    });

    const estimate = await tx.estimate.create({
      data: {
        organizationId,
        customerId: payload.customerId,
        createdById,
        estimateNumber,
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
        ...pickOptionalFields(payload),
        items: { create: totals.lines },
      },
      include: { items: true, customer: true },
    });

    return estimate;
  });
};

const getEstimates = async (organizationId: number, query: IEstimateQuery) => {
  const { search, orgRole: memberRole, userId } = query;

  const baseWhere: Record<string, unknown> = {
    organizationId,
    ...(memberRole === "staff" && userId ? { createdById: userId } : {}),
    ...(search
      ? {
          OR: [
            { estimateNumber: { contains: search } },
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
    allowedFields: ESTIMATE_FILTER_FIELDS,
    allowedSortFields: ESTIMATE_SORT_FIELDS,
    defaultSort: "estimateDate",
    defaultOrder: "desc",
    baseWhere,
  });

  const [data, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { customer: { select: { id: true, name: true } } },
    }),
    prisma.estimate.count({ where }),
  ]);

  return {
    data,
    meta: paginationMeta(total, page, limit),
  };
};

const getEstimateById = async (
  organizationId: number,
  estimateId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const estimate = await findEstimate(organizationId, estimateId, orgRole, userId);
  const status = await checkAutoExpiry(estimate);
  if (status !== estimate.status) {
    return { ...estimate, status };
  }
  return estimate;
};

const updateEstimate = async (
  organizationId: number,
  estimateId: number,
  payload: IUpdateEstimate,
  orgRole?: OrgRole,
  userId?: number
) => {
  const existing = await findEstimate(organizationId, estimateId, orgRole, userId);

  if (existing.status !== "draft") {
    const attempted = Object.keys(payload).filter(
      (key) => payload[key as keyof IUpdateEstimate] !== undefined
    );
    const blocked = attempted.filter((key) => !POST_ISSUE_EDITABLE.has(key));
    if (blocked.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `An estimate that is ${existing.status} cannot have these fields changed: ${blocked.join(", ")}`
      );
    }
  }

  if (payload.status !== undefined && payload.status !== existing.status) {
    if (!ALLOWED_TRANSITIONS[existing.status].includes(payload.status)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot change estimate status from ${existing.status} to ${payload.status}`
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updateData: Prisma.EstimateUpdateInput = { ...pickOptionalFields(payload) };

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

    const recalculate =
      payload.items !== undefined ||
      payload.discount !== undefined ||
      payload.customerId !== undefined;

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
        discount: payload.discount ?? Number(existing.discount),
        isIntraState,
      });

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

      if (payload.items) {
        await tx.estimateItem.deleteMany({ where: { estimateId } });
        updateData.items = { create: totals.lines };
      }
    }

    const updated = await tx.estimate.update({
      where: { id: estimateId },
      data: updateData,
      include: { items: true, customer: true },
    });

    return updated;
  });
};

const deleteEstimate = async (
  organizationId: number,
  estimateId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const estimate = await findEstimate(organizationId, estimateId, orgRole, userId);

  if (!["draft", "cancelled"].includes(estimate.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `A ${estimate.status} estimate cannot be deleted`
    );
  }

  return prisma.estimate.delete({ where: { id: estimateId } });
};

const getEstimateForSend = async (
  organizationId: number,
  estimateId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      organizationId,
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
  if (!estimate) throw new ApiError(httpStatus.NOT_FOUND, "Estimate not found");
  return estimate;
};

const sendEstimate = async (
  organizationId: number,
  estimateId: number,
  payload: { to: string; subject: string; message: string },
  userId: number,
  orgRole?: OrgRole
) => {
  const estimate = await getEstimateForSend(organizationId, estimateId, orgRole, userId);
  const org = estimate.organization;

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

  const html = buildInvoiceHtml({
    invoice: {
      ...estimate,
      invoiceNumber: estimate.estimateNumber,
      invoiceDate: estimate.estimateDate,
    } as any,
    org,
    logoBase64,
    qrDataUrl: null,
    documentTitle: "Estimate",
    showPayment: false,
  });
  const pdfBuffer = await generateInvoicePdf(html);

  let smtpSent = false;
  try {
    smtpSent = await sendMailWithAttachment({
      to: payload.to,
      subject: payload.subject,
      html: `<div style="font-family:sans-serif;">${payload.message.replace(/\n/g, "<br>")}</div>`,
      attachments: [
        {
          filename: `${estimate.estimateNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch {
    // SMTP failure is non-fatal
  }

  logEmail({
    orgName: org.name,
    to: payload.to,
    subject: payload.subject,
    body: payload.message,
    attachmentName: `${estimate.estimateNumber}.pdf`,
    attachmentSizeKb: Math.round(pdfBuffer.length / 1024),
    smtpSent,
  });

  if (estimate.status === "draft") {
    return EstimateService.updateEstimate(
      organizationId,
      estimateId,
      { status: "sent" as EstimateStatus },
      orgRole,
      userId
    );
  }

  return estimate;
};

const convertToInvoice = async (
  organizationId: number,
  estimateId: number,
  orgRole?: OrgRole,
  userId?: number
) => {
  const estimate = await findEstimate(organizationId, estimateId, orgRole, userId);

  if (estimate.status !== "accepted") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only accepted estimates can be converted to invoices"
    );
  }

  if (estimate.convertedToInvoiceId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This estimate has already been converted to an invoice"
    );
  }

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { nextInvoiceNumber: { increment: 1 } },
    });

    const sequence = org.nextInvoiceNumber - 1;
    const invoiceNumber = `${org.invoicePrefix}-${String(sequence).padStart(4, "0")}`;

    const invoice = await tx.invoice.create({
      data: {
        organizationId,
        customerId: estimate.customerId,
        createdById: userId ?? null,
        invoiceNumber,
        subtotal: estimate.subtotal,
        discount: estimate.discount,
        taxableValue: estimate.taxableValue,
        cgstTotal: estimate.cgstTotal,
        sgstTotal: estimate.sgstTotal,
        igstTotal: estimate.igstTotal,
        tax: estimate.tax,
        roundOff: estimate.roundOff,
        grandTotal: estimate.grandTotal,
        placeOfSupply: estimate.placeOfSupply,
        isIntraState: estimate.isIntraState,
        amountInWords: estimate.amountInWords,
        challanNo: estimate.challanNo,
        vehicleNo: estimate.vehicleNo,
        siteLocation: estimate.siteLocation,
        billingAddress: estimate.billingAddress,
        referenceNumber: estimate.referenceNumber,
        termsAndConditions: estimate.termsAndConditions,
        notes: estimate.notes,
        authorizedSignatory: estimate.authorizedSignatory,
        items: {
          create: estimate.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            description: item.description,
            hsnCode: item.hsnCode,
            unit: item.unit,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            discount: item.discount,
            taxableValue: item.taxableValue,
            gstRate: item.gstRate,
            cgst: item.cgst,
            sgst: item.sgst,
            igst: item.igst,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    const updatedEstimate = await tx.estimate.update({
      where: { id: estimateId },
      data: {
        status: "converted",
        convertedToInvoiceId: invoice.id,
      },
      include: { items: true, customer: true },
    });

    return { estimate: updatedEstimate, invoice };
  });
};

const updateStatus = async (
  organizationId: number,
  estimateId: number,
  status: EstimateStatus,
  orgRole?: OrgRole,
  userId?: number
) => {
  const estimate = await findEstimate(organizationId, estimateId, orgRole, userId);

  if (!ALLOWED_TRANSITIONS[estimate.status].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot change estimate status from ${estimate.status} to ${status}`
    );
  }

  return prisma.estimate.update({
    where: { id: estimateId },
    data: { status },
    include: { items: true, customer: true },
  });
};

export const EstimateService = {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  sendEstimate,
  convertToInvoice,
  updateStatus,
};
