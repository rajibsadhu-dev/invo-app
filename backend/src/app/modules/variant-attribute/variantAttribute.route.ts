import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { VariantAttributeValidation } from "./variantAttribute.validation";
import { VariantAttributeController } from "./variantAttribute.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("product:create"),
  validateRequest(VariantAttributeValidation.createVariantAttributeSchema),
  VariantAttributeController.createAttribute
);

router.get("/", orgRole("product:view"), VariantAttributeController.getAttributes);

router.get(
  "/:attributeId",
  orgRole("product:view"),
  VariantAttributeController.getAttributeById
);

router.patch(
  "/:attributeId",
  orgRole("product:edit"),
  validateRequest(VariantAttributeValidation.updateVariantAttributeSchema),
  VariantAttributeController.updateAttribute
);

router.delete(
  "/:attributeId",
  orgRole("product:delete"),
  VariantAttributeController.deleteAttribute
);

export const VariantAttributeRoutes = router;
