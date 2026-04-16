import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import { InvoiceValidation } from "./invoice.validation";
import { InvoiceController } from "./invoice.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  validateRequest(InvoiceValidation.createInvoiceSchema),
  InvoiceController.createInvoice
);

router.get("/", InvoiceController.getInvoices);

router.get("/:invoiceId", InvoiceController.getInvoiceById);

router.patch(
  "/:invoiceId",
  validateRequest(InvoiceValidation.updateInvoiceSchema),
  InvoiceController.updateInvoice
);

router.delete("/:invoiceId", InvoiceController.deleteInvoice);

export const InvoiceRoutes = router;
