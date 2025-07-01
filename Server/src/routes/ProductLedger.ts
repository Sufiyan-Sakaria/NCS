import { Router, Request, Response, NextFunction } from "express";
import {
  getProductLedgersByBranch,
  createProductLedger,
  getFilteredLedgerEntries,
  getProductStockSummary,
  getProductEntries,
} from "../controllers/ProductLedger";

const router = Router();

// More specific routes should come BEFORE parameterized routes
// GET ledger entries by ledger ID with optional filters (godown/date)
router.get("/entries/:ledgerId", getFilteredLedgerEntries);

// GET product entries for a specific product with timestamp filters
router.get("/product/:productId/entries", getProductEntries);

// GET stock summary (total qty/thaan) for a product
router.get("/summary/:productId", getProductStockSummary);

// Parameterized routes should come AFTER specific routes
// GET all product ledgers by branch
router.get("/:branchId", getProductLedgersByBranch);

// CREATE product ledger for a financial year
router.post("/:branchId", createProductLedger);

export default router;
