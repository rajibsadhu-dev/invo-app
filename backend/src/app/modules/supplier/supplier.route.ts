import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { SupplierValidation } from "./supplier.validation";
import { SupplierController } from "./supplier.controller";

const router = Router({ mergeParams: true });

router.get("/search", orgRole("supplier:view"), SupplierController.searchSuppliers);

router.post(
  "/",
  orgRole("supplier:create"),
  validateRequest(SupplierValidation.createSupplierSchema),
  SupplierController.createSupplier
);

router.get("/", orgRole("supplier:view"), SupplierController.getSuppliers);

router.get("/:supplierId", orgRole("supplier:view"), SupplierController.getSupplierById);

router.patch(
  "/:supplierId",
  orgRole("supplier:edit"),
  validateRequest(SupplierValidation.updateSupplierSchema),
  SupplierController.updateSupplier
);

router.delete("/:supplierId", orgRole("supplier:delete"), SupplierController.deleteSupplier);

export const SupplierRoutes = router;
