import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await ProductService.createProduct(organizationId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

const getProducts = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { filter, search, sort, page, limit, categoryId, isActive } = req.query;

  const result = await ProductService.getProducts(organizationId, {
    filters: filter as string | string[] | undefined,
    search: search as string | undefined,
    sort: sort as string | undefined,
    page: page as string | undefined,
    limit: limit as string | undefined,
    categoryId: categoryId as string | undefined,
    isActive: isActive as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const searchProducts = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await ProductService.searchProducts(organizationId, req.query.q as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully",
    data: result,
  });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const result = await ProductService.getProductById(organizationId, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const result = await ProductService.updateProduct(organizationId, productId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const { deactivated } = await ProductService.deleteProduct(organizationId, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: deactivated
      ? "Product is used on invoices and has been deactivated instead of deleted"
      : "Product deleted successfully",
    data: null,
  });
});

export const ProductController = {
  createProduct,
  getProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
