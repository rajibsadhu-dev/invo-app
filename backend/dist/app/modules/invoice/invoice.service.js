"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const amountInWords_1 = require("@/helpers/amountInWords");
// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTotals(items, tax, discount) {
    const itemsWithAmount = items.map((item) => ({
        ...item,
        amount: Number((item.quantity * item.rate).toFixed(2)),
    }));
    const subtotal = Number(itemsWithAmount.reduce((s, i) => s + i.amount, 0).toFixed(2));
    const grandTotal = Number((subtotal + tax - discount).toFixed(2));
    return { itemsWithAmount, subtotal, grandTotal };
}
function addBalanceDue(invoice) {
    const grand = Number(invoice.grandTotal);
    const received = Number(invoice.receivedAmount);
    return { ...invoice, balanceDue: Number((grand - received).toFixed(2)) };
}
async function findInvoice(organizationId, invoiceId) {
    const invoice = await prisma_1.default.invoice.findFirst({
        where: { id: invoiceId, organizationId },
        include: { items: true, customer: true },
    });
    if (!invoice)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Invoice not found");
    return invoice;
}
// ─── Optional field payload ────────────────────────────────────────────────────
function pickOptionalFields(payload) {
    return {
        ...(payload.invoiceDate !== undefined && { invoiceDate: new Date(payload.invoiceDate) }),
        ...(payload.challanNo !== undefined && { challanNo: payload.challanNo }),
        ...(payload.vehicleNo !== undefined && { vehicleNo: payload.vehicleNo }),
        ...(payload.siteLocation !== undefined && { siteLocation: payload.siteLocation }),
        ...(payload.billingAddress !== undefined && { billingAddress: payload.billingAddress }),
        ...(payload.referenceNumber !== undefined && { referenceNumber: payload.referenceNumber }),
        ...(payload.paymentMethod !== undefined && { paymentMethod: payload.paymentMethod }),
        ...(payload.bankName !== undefined && { bankName: payload.bankName }),
        ...(payload.bankAccount !== undefined && { bankAccount: payload.bankAccount }),
        ...(payload.bankIfsc !== undefined && { bankIfsc: payload.bankIfsc }),
        ...(payload.transactionNumber !== undefined && { transactionNumber: payload.transactionNumber }),
        ...(payload.termsAndConditions !== undefined && { termsAndConditions: payload.termsAndConditions }),
        ...(payload.notes !== undefined && { notes: payload.notes }),
        ...(payload.authorizedSignatory !== undefined && { authorizedSignatory: payload.authorizedSignatory }),
    };
}
// ─── Service ──────────────────────────────────────────────────────────────────
const createInvoice = async (organizationId, payload) => {
    return prisma_1.default.$transaction(async (tx) => {
        const org = await tx.organization.findUnique({ where: { id: organizationId } });
        if (!org)
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Organization not found");
        const customer = await tx.customer.findFirst({
            where: { id: payload.customerId, organizationId },
        });
        if (!customer)
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Customer not found");
        const tax = payload.tax ?? 0;
        const discount = payload.discount ?? 0;
        const receivedAmount = payload.receivedAmount ?? 0;
        const { itemsWithAmount, subtotal, grandTotal } = calcTotals(payload.items, tax, discount);
        const invoiceNumber = `${org.invoicePrefix}-${String(org.nextInvoiceNumber).padStart(4, "0")}`;
        const invoice = await tx.invoice.create({
            data: {
                organizationId,
                customerId: payload.customerId,
                invoiceNumber,
                subtotal,
                tax,
                discount,
                grandTotal,
                receivedAmount,
                amountInWords: (0, amountInWords_1.amountInWords)(grandTotal),
                ...pickOptionalFields(payload),
                items: { create: itemsWithAmount },
            },
            include: { items: true, customer: true },
        });
        await tx.organization.update({
            where: { id: organizationId },
            data: { nextInvoiceNumber: { increment: 1 } },
        });
        return addBalanceDue(invoice);
    });
};
const getInvoices = async (organizationId, query) => {
    const { status, customerId, search, page = 1, limit = 10, sortBy = "invoiceDate", sortOrder = "desc", } = query;
    const where = {
        organizationId,
        ...(status && { status }),
        ...(customerId && { customerId }),
        ...(search && {
            OR: [
                { invoiceNumber: { contains: search } },
                { customer: { name: { contains: search } } },
            ],
        }),
    };
    const allowedSortFields = ["invoiceNumber", "invoiceDate", "grandTotal", "status", "createdAt"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "invoiceDate";
    const [data, total] = await Promise.all([
        prisma_1.default.invoice.findMany({
            where,
            orderBy: { [orderByField]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                customer: { select: { id: true, name: true } },
                items: true,
            },
        }),
        prisma_1.default.invoice.count({ where }),
    ]);
    return {
        data: data.map(addBalanceDue),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
};
const getInvoiceById = async (organizationId, invoiceId) => {
    const invoice = await findInvoice(organizationId, invoiceId);
    return addBalanceDue(invoice);
};
const updateInvoice = async (organizationId, invoiceId, payload) => {
    await findInvoice(organizationId, invoiceId);
    return prisma_1.default.$transaction(async (tx) => {
        const updateData = {};
        if (payload.customerId !== undefined) {
            const customer = await tx.customer.findFirst({
                where: { id: payload.customerId, organizationId },
            });
            if (!customer)
                throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Customer not found");
            updateData.customer = { connect: { id: payload.customerId } };
        }
        if (payload.status !== undefined)
            updateData.status = payload.status;
        if (payload.receivedAmount !== undefined)
            updateData.receivedAmount = payload.receivedAmount;
        // Spread all optional string/enum fields
        Object.assign(updateData, pickOptionalFields(payload));
        // Recalculate totals if items or tax/discount changed
        if (payload.items !== undefined) {
            const current = await tx.invoice.findUnique({
                where: { id: invoiceId },
                select: { tax: true, discount: true },
            });
            const tax = payload.tax ?? Number(current.tax);
            const discount = payload.discount ?? Number(current.discount);
            const { itemsWithAmount, subtotal, grandTotal } = calcTotals(payload.items, tax, discount);
            updateData.subtotal = subtotal;
            updateData.tax = tax;
            updateData.discount = discount;
            updateData.grandTotal = grandTotal;
            updateData.amountInWords = (0, amountInWords_1.amountInWords)(grandTotal);
            await tx.invoiceItem.deleteMany({ where: { invoiceId } });
            await tx.invoiceItem.createMany({
                data: itemsWithAmount.map((item) => ({ ...item, invoiceId })),
            });
        }
        else if (payload.tax !== undefined || payload.discount !== undefined) {
            const current = await tx.invoice.findUnique({
                where: { id: invoiceId },
                select: { subtotal: true, tax: true, discount: true },
            });
            const tax = payload.tax ?? Number(current.tax);
            const discount = payload.discount ?? Number(current.discount);
            const subtotal = Number(current.subtotal);
            const grandTotal = Number((subtotal + tax - discount).toFixed(2));
            updateData.tax = tax;
            updateData.discount = discount;
            updateData.grandTotal = grandTotal;
            updateData.amountInWords = (0, amountInWords_1.amountInWords)(grandTotal);
        }
        const updated = await tx.invoice.update({
            where: { id: invoiceId },
            data: updateData,
            include: { items: true, customer: true },
        });
        return addBalanceDue(updated);
    });
};
const deleteInvoice = async (organizationId, invoiceId) => {
    await findInvoice(organizationId, invoiceId);
    return prisma_1.default.invoice.delete({ where: { id: invoiceId } });
};
exports.InvoiceService = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
};
//# sourceMappingURL=invoice.service.js.map