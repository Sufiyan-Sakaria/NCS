import { Router } from "express";
import {
  getCategoriesByBranch,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controllers/Category";

const router = Router();

// GET all categories by branch
router.get("/:branchId", getCategoriesByBranch);

// CREATE a category
router.post("/:branchId", createCategory);

// UPDATE a category
router.put("/:id", updateCategory);

// TOGGLE active status
router.patch("/:id/toggle", toggleCategoryStatus);

// DELETE a category
router.delete("/:id", deleteCategory);

export default router;
