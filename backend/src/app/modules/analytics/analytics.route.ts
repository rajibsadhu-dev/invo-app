import { Router } from "express";
import ownershipGuard from "@/app/middlewares/ownershipGuard";
import { AnalyticsController } from "./analytics.controller";

const router = Router({ mergeParams: true });

router.use(ownershipGuard);

router.get("/summary", AnalyticsController.getSummary);
router.get("/revenue-over-time", AnalyticsController.getRevenueOverTime);
router.get("/gst-summary", AnalyticsController.getGstSummary);
router.get("/top-customers", AnalyticsController.getTopCustomers);
router.get("/status-breakdown", AnalyticsController.getStatusBreakdown);

export const AnalyticsRoutes = router;
