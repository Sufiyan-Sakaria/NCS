import { Router } from "express";
import {
  getProductsByBranch,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
  getProductStock,
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

// GET product stock by branch, with optional productId and godownId as query params
router.get("/:branchId/stocks", getProductStock);

export default router;
