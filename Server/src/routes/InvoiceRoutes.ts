import express from "express";
import {
  GetAllInvoices,
  GetSingleInvoice,
  CreateInvoice,
  UpdateInvoice,
  DeleteInvoice,
} from "../controllers/InvoiceController";

const router = express.Router();

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices with optional filtering by type
 * @access  Private
 * @query   page - pagination page number
 * @query   limit - number of items per page
 * @query   type - filter by invoice type (Sale or Purchase)
 */
router.get("/", GetAllInvoices);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get a single invoice by ID with its items
 * @access  Private
 * @param   id - Invoice ID
 */
router.get("/:id", GetSingleInvoice);

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice (Sale or Purchase)
 * @access  Private
 * @body    {
 *            invoice_no: string,
 *            date: string (optional, defaults to current date),
 *            account_id: string,
 *            description: string (optional),
 *            type: "Sale" | "Purchase",
 *            items: Array<{
 *              product_id: string,
 *              quantity: number,
 *              unit_price: number,
 *              godown_id: string
 *            }>
 *          }
 */
router.post("/", CreateInvoice);

/**
 * @route   PATCH /api/invoices/:id
 * @desc    Update an invoice (only description can be updated)
 * @access  Private
 * @param   id - Invoice ID
 * @body    {
 *            description: string
 *          }
 */
router.patch("/:id", UpdateInvoice);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete an invoice (not recommended, will return error by default)
 * @access  Private
 * @param   id - Invoice ID
 */
router.delete("/:id", DeleteInvoice);

export default router;
