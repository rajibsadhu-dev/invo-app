import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { CustomerValidation } from "./customer.validation";
import { CustomerController } from "./customer.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("customer:create"),
  validateRequest(CustomerValidation.createCustomerSchema),
  CustomerController.createCustomer
);

router.get("/", orgRole("customer:view"), CustomerController.getCustomers);

router.get("/:customerId", orgRole("customer:view"), CustomerController.getCustomerById);

router.patch(
  "/:customerId",
  orgRole("customer:edit"),
  validateRequest(CustomerValidation.updateCustomerSchema),
  CustomerController.updateCustomer
);

router.delete("/:customerId", orgRole("customer:delete"), CustomerController.deleteCustomer);

export const CustomerRoutes = router;
