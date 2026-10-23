import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { ProductValidation } from "./product.validation";
import { ProductController } from "./product.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("product:create"),
  validateRequest(ProductValidation.createProductSchema),
  ProductController.createProduct
);

router.get("/", orgRole("product:view"), ProductController.getProducts);

// Registered before /:productId so "search" is not read as an id.
router.get("/search", orgRole("product:view"), ProductController.searchProducts);

router.get("/:productId", orgRole("product:view"), ProductController.getProductById);

router.patch(
  "/:productId",
  orgRole("product:edit"),
  validateRequest(ProductValidation.updateProductSchema),
  ProductController.updateProduct
);

router.delete("/:productId", orgRole("product:delete"), ProductController.deleteProduct);

export const ProductRoutes = router;
