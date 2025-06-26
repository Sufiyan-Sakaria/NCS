import { Router } from "express";
import {
  getProductsByBranch,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} from "../controllers/Product";

const router = Router();

// GET all products by branch
router.get("/:branchId", getProductsByBranch);

// CREATE a product (with optional multiple godown stocks)
router.post("/:branchId", createProduct);

// UPDATE a product
router.put("/:id", updateProduct);

// TOGGLE active status
router.patch("/:id/toggle", toggleProductStatus);

// DELETE a product
router.delete("/:id", deleteProduct);

export default router;
