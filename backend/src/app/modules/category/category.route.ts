import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import orgRole from "@/app/middlewares/orgRole";
import { CategoryValidation } from "./category.validation";
import { CategoryController } from "./category.controller";

const router = Router({ mergeParams: true });

router.post(
  "/",
  orgRole("product:create"),
  validateRequest(CategoryValidation.createCategorySchema),
  CategoryController.createCategory
);

router.get("/", orgRole("product:view"), CategoryController.getCategories);

router.get("/:categoryId", orgRole("product:view"), CategoryController.getCategoryById);

router.patch(
  "/:categoryId",
  orgRole("product:edit"),
  validateRequest(CategoryValidation.updateCategorySchema),
  CategoryController.updateCategory
);

router.delete("/:categoryId", orgRole("product:delete"), CategoryController.deleteCategory);

export const CategoryRoutes = router;
