import { Router } from "express";
import { VerifyController } from "./verify.controller";

const router = Router();

router.get("/:token", VerifyController.verifyInvoice);

export const VerifyRoutes = router;
