import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { PurchaseOrderValidation } from "./purchaseOrder.validation";
import { PurchaseOrderController } from "./purchaseOrder.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("purchase_order:create"),
  validateRequest(PurchaseOrderValidation.createPOSchema),
  PurchaseOrderController.createPurchaseOrder
);

router.get("/", orgRole("purchase_order:view"), PurchaseOrderController.getPurchaseOrders);

router.get("/:poId", orgRole("purchase_order:view"), PurchaseOrderController.getPurchaseOrderById);

router.patch(
  "/:poId",
  orgRole("purchase_order:edit"),
  validateRequest(PurchaseOrderValidation.updatePOSchema),
  PurchaseOrderController.updatePurchaseOrder
);

router.delete("/:poId", orgRole("purchase_order:delete"), PurchaseOrderController.deletePurchaseOrder);

router.post(
  "/:poId/receive",
  orgRole("purchase_order:edit"),
  validateRequest(PurchaseOrderValidation.receivePOSchema),
  PurchaseOrderController.receiveGoods
);

export const PurchaseOrderRoutes = router;
