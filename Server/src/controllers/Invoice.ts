import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// Get all invoices
export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
        ledger: true,
        createdByUser: true,
        updatedByUser: true,
        invoiceBook: true,
      },
    });
    res.json(invoices);
  } catch (error) {
    next(new AppError("Failed to fetch invoices", 500));
  }
};

// Get invoice by ID
export const getInvoiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        ledger: true,
        createdByUser: true,
        updatedByUser: true,
        invoiceBook: true,
      },
    });
    if (!invoice) return next(new AppError("Invoice not found", 404));
    res.json(invoice);
  } catch (error) {
    next(new AppError("Failed to fetch invoice", 500));
  }
};

// Create invoice
export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      invoiceNumber,
      date,
      type,
      invoiceBookId,
      ledgerId,
      totalAmount,
      discount,
      taxAmount,
      grandTotal,
      narration,
      items,
      createdBy,
    } = req.body;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        date,
        type,
        invoiceBookId,
        ledgerId,
        totalAmount,
        discount,
        taxAmount,
        grandTotal,
        narration,
        createdBy,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
    res.status(201).json(invoice);
  } catch (error) {
    next(new AppError("Failed to create invoice", 500));
  }
};

// Update invoice
export const updateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      invoiceNumber,
      date,
      type,
      invoiceBookId,
      ledgerId,
      totalAmount,
      discount,
      taxAmount,
      grandTotal,
      narration,
      updatedBy,
      items,
    } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        date,
        type,
        invoiceBookId,
        ledgerId,
        totalAmount,
        discount,
        taxAmount,
        grandTotal,
        narration,
        updatedBy,
        items: {
          deleteMany: {},
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
    res.json(invoice);
  } catch (error) {
    next(new AppError("Failed to update invoice", 500));
  }
};

// Delete invoice
export const deleteInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await prisma.invoice.delete({ where: { id } });
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    next(new AppError("Failed to delete invoice", 500));
  }
};
