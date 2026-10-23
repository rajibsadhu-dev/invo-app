import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { ProductValidation } from "./product.validation";
import { ProductController } from "./product.controller";
import { VariantValidation } from "./variant.validation";
import { VariantController } from "./variant.controller";

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

// ─── Variant routes (nested under /:productId/variants) ─────────────────────

router.get(
  "/:productId/variants",
  orgRole("product:view"),
  VariantController.getVariants
);

router.post(
  "/:productId/variants",
  orgRole("product:create"),
  validateRequest(VariantValidation.createVariantSchema),
  VariantController.createVariant
);

router.post(
  "/:productId/variants/generate",
  orgRole("product:create"),
  validateRequest(VariantValidation.bulkGenerateSchema),
  VariantController.bulkGenerate
);

router.get(
  "/:productId/variants/:variantId",
  orgRole("product:view"),
  VariantController.getVariantById
);

router.patch(
  "/:productId/variants/:variantId",
  orgRole("product:edit"),
  validateRequest(VariantValidation.updateVariantSchema),
  VariantController.updateVariant
);

router.delete(
  "/:productId/variants/:variantId",
  orgRole("product:delete"),
  VariantController.deleteVariant
);

export const ProductRoutes = router;
