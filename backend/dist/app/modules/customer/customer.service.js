"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const createCustomer = async (organizationId, payload) => {
    return prisma_1.default.customer.create({
        data: {
            ...payload,
            organizationId,
            email: payload.email || null,
        },
    });
};
const getCustomers = async (organizationId, query) => {
    const { search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", } = query;
    const where = {
        organizationId,
        ...(search && {
            OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
            ],
        }),
    };
    const allowedSortFields = ["name", "email", "createdAt", "updatedAt"];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const [data, total] = await Promise.all([
        prisma_1.default.customer.findMany({
            where,
            orderBy: { [orderByField]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma_1.default.customer.count({ where }),
    ]);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
const getCustomerById = async (organizationId, customerId) => {
    const customer = await prisma_1.default.customer.findFirst({
        where: { id: customerId, organizationId },
    });
    if (!customer) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Customer not found");
    }
    return customer;
};
const updateCustomer = async (organizationId, customerId, payload) => {
    await getCustomerById(organizationId, customerId);
    return prisma_1.default.customer.update({
        where: { id: customerId },
        data: {
            ...payload,
            ...(payload.email !== undefined && { email: payload.email || null }),
        },
    });
};
const deleteCustomer = async (organizationId, customerId) => {
    await getCustomerById(organizationId, customerId);
    return prisma_1.default.customer.delete({ where: { id: customerId } });
};
exports.CustomerService = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
};
//# sourceMappingURL=customer.service.js.map