import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import emailVerified from "@/app/middlewares/emailVerified";
import { EstimateValidation } from "./estimate.validation";
import { EstimateController } from "./estimate.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("estimate:create"),
  emailVerified,
  validateRequest(EstimateValidation.createEstimateSchema),
  EstimateController.createEstimate
);

router.get("/", orgRole("estimate:view"), EstimateController.getEstimates);

router.get("/:estimateId", orgRole("estimate:view"), EstimateController.getEstimateById);

router.patch(
  "/:estimateId",
  orgRole("estimate:edit"),
  validateRequest(EstimateValidation.updateEstimateSchema),
  EstimateController.updateEstimate
);

router.delete("/:estimateId", orgRole("estimate:delete"), EstimateController.deleteEstimate);

router.post(
  "/:estimateId/send",
  orgRole("estimate:edit"),
  emailVerified,
  validateRequest(EstimateValidation.sendEstimateSchema),
  EstimateController.sendEstimate
);

router.post(
  "/:estimateId/convert",
  orgRole("estimate:edit"),
  emailVerified,
  EstimateController.convertToInvoice
);

router.patch(
  "/:estimateId/status",
  orgRole("estimate:edit"),
  validateRequest(EstimateValidation.updateEstimateStatusSchema),
  EstimateController.updateStatus
);

export const EstimateRoutes = router;
