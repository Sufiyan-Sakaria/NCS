import express from "express";
import {
  GetAllProducts,
  GetSingleProduct,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  UpdateProductStock,
  GetProductStockByGodowns,
  TransferStock,
} from "../controllers/ProductController";

const router = express.Router();

// Basic product CRUD routes
router.get("/", GetAllProducts);
router.get("/:id", GetSingleProduct);
router.post("/", CreateProduct);
router.patch("/:id", UpdateProduct);
router.delete("/:id", DeleteProduct);

// Stock management routes
router.get("/:productId/stock", GetProductStockByGodowns);
router.put("/:productId/godowns/:godownId/stock", UpdateProductStock);
router.post("/:productId/transfer", TransferStock);

export default router;
