import { Router } from "express";
import orgRole from "@/app/middlewares/orgRole";
import validateRequest from "@/app/middlewares/validateRequest";
import { InventoryController } from "./inventory.controller";
import {
  stockAdjustSchema,
  stockSetSchema,
  stockMovementQuerySchema,
} from "./inventory.validation";

const router = Router({ mergeParams: true });

// Stock adjustment on a specific product
router.post(
  "/products/:productId/stock-adjust",
  orgRole("product:edit"),
  validateRequest(stockAdjustSchema),
  InventoryController.adjustStock
);

router.post(
  "/products/:productId/stock-set",
  orgRole("product:edit"),
  validateRequest(stockSetSchema),
  InventoryController.setStock
);

// Stock movements for a specific product
router.get(
  "/products/:productId/stock-movements",
  orgRole("product:view"),
  validateRequest(stockMovementQuerySchema),
  InventoryController.getProductMovements
);

// Org-level inventory endpoints
router.get(
  "/movements",
  orgRole("product:view"),
  validateRequest(stockMovementQuerySchema),
  InventoryController.getMovements
);

router.get(
  "/low-stock",
  orgRole("product:view"),
  InventoryController.getLowStock
);

router.get(
  "/summary",
  orgRole("product:view"),
  InventoryController.getSummary
);

router.get(
  "/valuation",
  orgRole("product:view"),
  InventoryController.getValuation
);

export const InventoryRoutes = router;
