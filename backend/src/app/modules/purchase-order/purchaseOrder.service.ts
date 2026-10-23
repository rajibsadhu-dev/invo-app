import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { buildQuery, paginationMeta } from "@/helpers/queryBuilder";
import { dec, money } from "@/helpers/gst";
import type {
  POStatus,
  ICreatePurchaseOrder,
  IUpdatePurchaseOrder,
  IReceiveItem,
  IPOItemInput,
  IPurchaseOrderQuery,
} from "./purchaseOrder.interface";

const ALLOWED_TRANSITIONS: Record<POStatus, POStatus[]> = {
  draft: ["ordered", "cancelled"],
  ordered: ["partially_received", "received", "cancelled"],
  partially_received: ["received", "cancelled"],
  received: [],
  cancelled: [],
};

const FILTER_FIELDS = [
  "poNumber",
  "status",
  "supplierId",
  "grandTotal",
  "poDate",
  "expectedDate",
  "createdAt",
];

const SORT_FIELDS = [
  "poNumber",
  "poDate",
  "grandTotal",
  "status",
  "createdAt",
  "expectedDate",
];

const computeLineItem = (item: IPOItemInput) => {
  const qty = dec(item.quantity);
  const rate = money(item.rate);
  const amount = money(qty.times(rate));
  const gstRate = money(item.gstRate ?? 0);
  const gstAmount = money(amount.times(gstRate).dividedBy(100));

  return {
    productId: item.productId,
    productVariantId: item.productVariantId ?? null,
    description: item.description,
    hsnCode: item.hsnCode ?? null,
    unit: item.unit ?? null,
    quantity: qty.toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP),
    rate,
    amount,
    gstRate,
    gstAmount,
  };
};

const computeTotals = (
  lineItems: ReturnType<typeof computeLineItem>[]
) => {
  const subtotal = money(
    lineItems.reduce((sum, l) => sum.plus(l.amount), new Prisma.Decimal(0))
  );
  const taxTotal = money(
    lineItems.reduce((sum, l) => sum.plus(l.gstAmount), new Prisma.Decimal(0))
  );
  const grandTotal = money(subtotal.plus(taxTotal));
  return { subtotal, taxTotal, grandTotal };
};

const assertProductsInOrg = async (
  tx: Prisma.TransactionClient,
  organizationId: number,
  items: IPOItemInput[]
) => {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const found = await tx.product.count({
    where: { id: { in: productIds }, organizationId },
  });
  if (found !== productIds.length) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "One or more products not found in this organization"
    );
  }

  const variantItems = items.filter(
    (i): i is IPOItemInput & { productVariantId: number } =>
      typeof i.productVariantId === "number"
  );
  if (variantItems.length > 0) {
    const variantIds = [...new Set(variantItems.map((i) => i.productVariantId))];
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, productId: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v.productId]));

    for (const item of variantItems) {
      const ownerProductId = variantMap.get(item.productVariantId);
      if (ownerProductId === undefined) {
        throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
      }
      if (ownerProductId !== item.productId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Variant does not belong to the specified product"
        );
      }
    }
  }
};

const findPO = async (organizationId: number, poId: number) => {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, organizationId, deletedAt: null },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, hasVariants: true } },
          variant: { select: { id: true, name: true, sku: true } },
        },
      },
      supplier: true,
    },
  });
  if (!po) throw new ApiError(httpStatus.NOT_FOUND, "Purchase order not found");
  return po;
};

// ─── CRUD ──────────────────────────────────────────────────────────────────

const createPurchaseOrder = async (
  organizationId: number,
  payload: ICreatePurchaseOrder
) => {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirst({
      where: { id: payload.supplierId, organizationId },
    });
    if (!supplier) {
      throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
    }

    await assertProductsInOrg(tx, organizationId, payload.items);

    const org = await tx.organization.update({
      where: { id: organizationId },
      data: { nextPoNumber: { increment: 1 } },
    });
    const sequence = org.nextPoNumber - 1;
    const poNumber = `${org.poPrefix}-${String(sequence).padStart(4, "0")}`;

    const lineItems = payload.items.map(computeLineItem);
    const { subtotal, taxTotal, grandTotal } = computeTotals(lineItems);

    const po = await tx.purchaseOrder.create({
      data: {
        organizationId,
        supplierId: payload.supplierId,
        poNumber,
        poDate: payload.poDate ? new Date(payload.poDate) : new Date(),
        expectedDate: payload.expectedDate ? new Date(payload.expectedDate) : null,
        notes: payload.notes ?? null,
        subtotal,
        taxTotal,
        grandTotal,
        items: {
          create: lineItems.map((l) => ({
            productId: l.productId,
            productVariantId: l.productVariantId,
            description: l.description,
            hsnCode: l.hsnCode,
            unit: l.unit,
            quantity: l.quantity,
            rate: l.rate,
            amount: l.amount,
            gstRate: l.gstRate,
            gstAmount: l.gstAmount,
          })),
        },
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    return po;
  });
};

const getPurchaseOrders = async (
  organizationId: number,
  query: IPurchaseOrderQuery
) => {
  const { search } = query;

  const baseWhere: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { poNumber: { contains: search } },
            { supplier: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const { where, orderBy, skip, take, page, limit } = buildQuery({
    filters: query.filters,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    allowedFields: FILTER_FIELDS,
    allowedSortFields: SORT_FIELDS,
    defaultSort: "createdAt",
    defaultOrder: "desc",
    baseWhere,
  });

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    data,
    meta: paginationMeta(total, page, limit),
  };
};

const getPurchaseOrderById = async (organizationId: number, poId: number) => {
  return findPO(organizationId, poId);
};

const updatePurchaseOrder = async (
  organizationId: number,
  poId: number,
  payload: IUpdatePurchaseOrder
) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseOrder.findFirst({
      where: { id: poId, organizationId, deletedAt: null },
      include: { items: true },
    });
    if (!existing) {
      throw new ApiError(httpStatus.NOT_FOUND, "Purchase order not found");
    }

    // Status transition validation
    if (payload.status && payload.status !== existing.status) {
      const currentStatus = existing.status as POStatus;
      const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(payload.status)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Cannot transition from "${existing.status}" to "${payload.status}"`
        );
      }
    }

    // Items can only be edited in draft
    if (payload.items && existing.status !== "draft") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Line items can only be edited while the PO is in draft"
      );
    }

    if (payload.supplierId && payload.supplierId !== existing.supplierId) {
      const supplier = await tx.supplier.findFirst({
        where: { id: payload.supplierId, organizationId },
      });
      if (!supplier) {
        throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
      }
    }

    let lineData: Record<string, unknown> = {};

    if (payload.items) {
      await assertProductsInOrg(tx, organizationId, payload.items);

      const lineItems = payload.items.map(computeLineItem);
      const { subtotal, taxTotal, grandTotal } = computeTotals(lineItems);

      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poId } });

      await tx.purchaseOrderItem.createMany({
        data: lineItems.map((l) => ({
          purchaseOrderId: poId,
          productId: l.productId,
          productVariantId: l.productVariantId,
          description: l.description,
          hsnCode: l.hsnCode,
          unit: l.unit,
          quantity: l.quantity,
          rate: l.rate,
          amount: l.amount,
          gstRate: l.gstRate,
          gstAmount: l.gstAmount,
        })),
      });

      lineData = { subtotal, taxTotal, grandTotal };
    }

    const po = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        ...(payload.supplierId !== undefined && { supplierId: payload.supplierId }),
        ...(payload.poDate !== undefined && { poDate: new Date(payload.poDate) }),
        ...(payload.expectedDate !== undefined && {
          expectedDate: payload.expectedDate ? new Date(payload.expectedDate) : null,
        }),
        ...(payload.status !== undefined && { status: payload.status }),
        ...(payload.notes !== undefined && { notes: payload.notes || null }),
        ...lineData,
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    return po;
  });
};

const deletePurchaseOrder = async (organizationId: number, poId: number) => {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: poId, organizationId, deletedAt: null },
  });
  if (!po) {
    throw new ApiError(httpStatus.NOT_FOUND, "Purchase order not found");
  }

  if (po.status !== "draft" && po.status !== "cancelled") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only draft or cancelled purchase orders can be deleted"
    );
  }

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { deletedAt: new Date() },
  });
};

// ─── Receive Goods ──────────────────────────────────────────────────────────

const receiveGoods = async (
  organizationId: number,
  poId: number,
  userId: number,
  receiveItems: IReceiveItem[]
) => {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findFirst({
      where: { id: poId, organizationId, deletedAt: null },
      include: { items: true },
    });
    if (!po) {
      throw new ApiError(httpStatus.NOT_FOUND, "Purchase order not found");
    }

    const currentStatus = po.status as POStatus;
    if (currentStatus !== "ordered" && currentStatus !== "partially_received") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot receive goods on a "${po.status}" purchase order`
      );
    }

    const itemMap = new Map(po.items.map((i) => [i.id, i]));

    for (const ri of receiveItems) {
      const poItem = itemMap.get(ri.itemId);
      if (!poItem) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          `PO item ${ri.itemId} not found on this purchase order`
        );
      }

      const remaining = dec(poItem.quantity).minus(dec(poItem.receivedQuantity));
      if (dec(ri.quantity).greaterThan(remaining)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Cannot receive ${ri.quantity} of "${poItem.description}" — only ${remaining} remaining`
        );
      }

      // Update receivedQuantity on the PO item
      await tx.purchaseOrderItem.update({
        where: { id: ri.itemId },
        data: {
          receivedQuantity: {
            increment: new Prisma.Decimal(ri.quantity),
          },
        },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          organizationId,
          productId: poItem.productId,
          productVariantId: poItem.productVariantId,
          type: "purchase",
          quantity: new Prisma.Decimal(ri.quantity),
          referenceType: "purchase_order",
          referenceId: poId,
          notes: `Received from PO ${po.poNumber}`,
          createdBy: userId,
        },
      });

      // Update product/variant stock
      if (poItem.productVariantId) {
        await tx.productVariant.update({
          where: { id: poItem.productVariantId },
          data: {
            stockQuantity: { increment: new Prisma.Decimal(ri.quantity) },
          },
        });
      } else {
        await tx.product.update({
          where: { id: poItem.productId },
          data: {
            stockQuantity: { increment: new Prisma.Decimal(ri.quantity) },
          },
        });
      }

      // Update purchase price on the product
      await tx.product.update({
        where: { id: poItem.productId },
        data: { purchasePrice: poItem.rate },
      });
    }

    // Determine new PO status based on received quantities
    const updatedItems = await tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
    });

    const allReceived = updatedItems.every((i) =>
      dec(i.receivedQuantity).greaterThanOrEqualTo(dec(i.quantity))
    );
    const someReceived = updatedItems.some((i) =>
      dec(i.receivedQuantity).greaterThan(0)
    );

    let newStatus: POStatus;
    if (allReceived) {
      newStatus = "received";
    } else if (someReceived) {
      newStatus = "partially_received";
    } else {
      newStatus = "ordered";
    }

    const updated = await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
          },
        },
        supplier: true,
      },
    });

    return updated;
  });
};

export const PurchaseOrderService = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receiveGoods,
};
