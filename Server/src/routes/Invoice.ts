import { Router } from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoices,
  updateInvoice,
} from "../controllers/Invoice";

const router = Router();

// Route to get all invoices
router.get("/", getInvoices);

// Route to get a single invoice by ID
router.get("/:id", getInvoiceById);

// Route to create a new invoice
router.post("/:branchId", createInvoice);

// Route to update an invoice by ID
router.put("/:id", updateInvoice);

// Route to delete an invoice by ID
router.delete("/:id", deleteInvoice);

export default router;
