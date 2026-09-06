import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import emailVerified from "@/app/middlewares/emailVerified";
import { InvoiceValidation } from "./invoice.validation";
import { InvoiceController } from "./invoice.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("invoice:create"),
  emailVerified,
  validateRequest(InvoiceValidation.createInvoiceSchema),
  InvoiceController.createInvoice
);

router.get("/", orgRole("invoice:view"), InvoiceController.getInvoices);

router.get("/:invoiceId", orgRole("invoice:view"), InvoiceController.getInvoiceById);

router.patch(
  "/:invoiceId",
  orgRole("invoice:edit"),
  validateRequest(InvoiceValidation.updateInvoiceSchema),
  InvoiceController.updateInvoice
);

router.delete("/:invoiceId", orgRole("invoice:delete"), InvoiceController.deleteInvoice);

export const InvoiceRoutes = router;
