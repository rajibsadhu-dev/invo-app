"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("@/app/middlewares/validateRequest"));
const customer_validation_1 = require("./customer.validation");
const customer_controller_1 = require("./customer.controller");
// mergeParams: true lets this router access req.params.id from the parent org router
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/", (0, validateRequest_1.default)(customer_validation_1.CustomerValidation.createCustomerSchema), customer_controller_1.CustomerController.createCustomer);
router.get("/", customer_controller_1.CustomerController.getCustomers);
router.get("/:customerId", customer_controller_1.CustomerController.getCustomerById);
router.patch("/:customerId", (0, validateRequest_1.default)(customer_validation_1.CustomerValidation.updateCustomerSchema), customer_controller_1.CustomerController.updateCustomer);
router.delete("/:customerId", customer_controller_1.CustomerController.deleteCustomer);
exports.CustomerRoutes = router;
//# sourceMappingURL=customer.route.js.map