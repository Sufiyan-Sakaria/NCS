import { Router } from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoiceNumber,
  getInvoicesByBranch,
  updateInvoice,
} from "../controllers/Invoice";

const router = Router();

// Route to get all invoices
router.get("/:branchId", getInvoicesByBranch);

// Route to get a single invoice by ID
router.get("/:id", getInvoiceById);

// Route to get the next invoice number for a branch and type
router.get("/number/:branchId", getInvoiceNumber);

// Route to create a new invoice
router.post("/:branchId", createInvoice);

// Route to update an invoice by ID
router.put("/:id", updateInvoice);

// Route to delete an invoice by ID
router.delete("/:id", deleteInvoice);

export default router;
