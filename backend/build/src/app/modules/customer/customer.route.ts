import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import { CustomerValidation } from "./customer.validation";
import { CustomerController } from "./customer.controller";

// mergeParams: true lets this router access req.params.id from the parent org router
const router = Router({ mergeParams: true });

router.post(
  "/",
  validateRequest(CustomerValidation.createCustomerSchema),
  CustomerController.createCustomer
);

router.get("/", CustomerController.getCustomers);

router.get("/:customerId", CustomerController.getCustomerById);

router.patch(
  "/:customerId",
  validateRequest(CustomerValidation.updateCustomerSchema),
  CustomerController.updateCustomer
);

router.delete("/:customerId", CustomerController.deleteCustomer);

export const CustomerRoutes = router;
