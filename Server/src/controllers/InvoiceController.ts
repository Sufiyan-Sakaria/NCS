import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { v4 as uuidv4 } from "uuid";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  invoicesTable,
  invoiceItemsTable,
  accountsTable,
  ledgersTable,
  itemLedgersTable,
  productsTable,
  productLocationsTable,
} from "../db/schema";
import { AppError } from "../utils/AppError";

// Fetch all invoices
export const GetAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Create a base query first
    const baseQuery = db.select().from(invoicesTable);

    // Apply filter only if type is provided
    const filteredQuery = type
      ? baseQuery.where(
          eq(invoicesTable.type, String(type) as "Sale" | "Purchase")
        )
      : baseQuery;

    // Apply pagination after filtering
    const invoices = await filteredQuery
      .limit(Number(limit))
      .offset(offset)
      .orderBy(invoicesTable.date);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(invoicesTable);

    const count = Number(countResult[0]?.count) || 0;

    if (!invoices.length) {
      return next(new AppError("No invoices found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Invoices fetched successfully",
      invoices,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single invoice by id
export const GetSingleInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const invoice = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, id));

    if (!invoice.length) {
      return next(new AppError("Invoice not found", 404));
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItemsTable)
      .where(eq(invoiceItemsTable.invoice_id, id));

    res.status(200).json({
      status: "success",
      message: "Invoice fetched successfully",
      invoice: {
        ...invoice[0],
        items,
      },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create a new invoice
export const CreateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Start a transaction to ensure data consistency
  return await db.transaction(async (tx) => {
    try {
      const { date, account_id, description, type, items } = req.body;

      // Validate required fields
      if (!account_id || !type || !items || !items.length) {
        return next(new AppError("Missing required fields", 400));
      }

      const invoice_no = await getNextInvoiceNumber(tx, type);

      // Calculate total amount from items
      const totalAmount = items.reduce(
        (sum: number, item: any) =>
          sum + Number(item.quantity) * Number(item.unit_price),
        0
      );

      // 1. Create the invoice
      const invoiceId = uuidv4();
      const invoice = await tx
        .insert(invoicesTable)
        .values({
          id: invoiceId,
          invoice_no,
          date: date ? new Date(date) : new Date(),
          account_id,
          total_amount: totalAmount.toString(),
          description,
          type,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      // 2. Create invoice items
      for (const item of items) {
        const { product_id, quantity, unit_price, godown_id, thaan } = item;

        // Validate godown_id is present
        if (!godown_id) {
          return next(new AppError("Godown ID is required for each item", 400));
        }

        const itemTotal = Number(quantity) * Number(unit_price);

        await tx.insert(invoiceItemsTable).values({
          id: uuidv4(),
          product_id,
          quantity: quantity.toString(),
          thaan: thaan ? thaan.toString() : "0",
          unit_price: unit_price.toString(),
          total_amount: itemTotal.toString(),
          invoice_id: invoiceId,
          godown_id,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // 3 & 6. Update product stock and create item ledger entries
      for (const item of items) {
        const { product_id, quantity, unit_price, godown_id, thaan } = item;
        if (!godown_id) {
          return next(new AppError("Godown ID is required for each item", 400));
        }

        const itemTotal = Number(quantity) * Number(unit_price);
        const itemQuantity = Number(quantity);
        const itemThaan = thaan ? Number(thaan) : 0;

        // Get current product location data
        const productLocation = await tx
          .select()
          .from(productLocationsTable)
          .where(
            and(
              eq(productLocationsTable.product_id, product_id),
              eq(productLocationsTable.godown_id, godown_id)
            )
          )
          .then((rows) => rows[0]);

        // Get current product data
        const product = await tx
          .select()
          .from(productsTable)
          .where(eq(productsTable.id, product_id))
          .then((rows) => rows[0]);

        if (!product) {
          return next(
            new AppError(`Product with ID ${product_id} not found`, 404)
          );
        }

        const previousQuantityLocation = productLocation
          ? Number(productLocation.quantity)
          : 0;
        const previousThaanLocation = productLocation
          ? Number(productLocation.thaan)
          : 0;
        const previousQuantityProduct = Number(product.quantity);
        const previousThaanProduct = Number(product.thaan);

        // Determine quantity changes based on invoice type
        let newQuantityLocation,
          newThaanLocation,
          newQuantityProduct,
          newThaanProduct;
        let quantityIn = "0",
          quantityOut = "0",
          thaanIn = "0",
          thaanOut = "0";
        let transactionType:
          | "Sale"
          | "Purchase"
          | "Opening"
          | "PurchaseReturn"
          | "SaleReturn"
          | "Adjustment"
          | "Transfer";

        if (type === "Sale") {
          // For sales, decrease stock
          newQuantityLocation = previousQuantityLocation - itemQuantity;
          newThaanLocation = previousThaanLocation - itemThaan;
          newQuantityProduct = previousQuantityProduct - itemQuantity;
          newThaanProduct = previousThaanProduct - itemThaan;
          quantityOut = itemQuantity.toString();
          thaanOut = itemThaan.toString();
          transactionType = "Sale";

          // Check if we have enough stock (both quantity and thaan)
          if (newQuantityLocation < 0 || newThaanLocation < 0) {
            return next(
              new AppError(
                `Insufficient stock for product ID ${product_id} in godown ${godown_id}`,
                400
              )
            );
          }
        } else {
          // For purchases, increase stock
          newQuantityLocation = previousQuantityLocation + itemQuantity;
          newThaanLocation = previousThaanLocation + itemThaan;
          newQuantityProduct = previousQuantityProduct + itemQuantity;
          newThaanProduct = previousThaanProduct + itemThaan;
          quantityIn = itemQuantity.toString();
          thaanIn = itemThaan.toString();
          transactionType = "Purchase";
        }

        // Update product location stock or create if not exists
        if (productLocation) {
          await tx
            .update(productLocationsTable)
            .set({
              quantity: newQuantityLocation.toString(),
              thaan: newThaanLocation.toString(),
              updated_at: new Date(),
            })
            .where(eq(productLocationsTable.id, productLocation.id));
        } else {
          await tx.insert(productLocationsTable).values({
            product_id,
            godown_id,
            quantity: newQuantityLocation.toString(),
            thaan: newThaanLocation.toString(),
            created_at: new Date(),
            updated_at: new Date(),
          });
        }

        // Update product total stock
        await tx
          .update(productsTable)
          .set({
            quantity: newQuantityProduct.toString(),
            thaan: newThaanProduct.toString(),
            updated_at: new Date(),
          })
          .where(eq(productsTable.id, product_id));

        // Create item ledger entry
        await tx.insert(itemLedgersTable).values({
          id: uuidv4(),
          date: date ? new Date(date) : new Date(),
          product_id,
          godown_id,
          transaction_type: transactionType,
          quantity_in: quantityIn,
          quantity_out: quantityOut,
          thaan_in: thaanIn,
          thaan_out: thaanOut,
          unit_price: unit_price.toString(),
          total_amount: itemTotal.toString(),
          invoice_id: invoiceId,
          previous_quantity: previousQuantityLocation.toString(),
          previous_thaan: previousThaanLocation.toString(),
          description: `${type} invoice: ${invoice_no}`,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // 4 & 5. Update account balance and create ledger entry
      // Get current account data
      const account = await tx
        .select()
        .from(accountsTable)
        .where(eq(accountsTable.id, account_id))
        .then((rows) => rows[0]);

      if (!account) {
        return next(
          new AppError(`Account with ID ${account_id} not found`, 404)
        );
      }

      const previousBalance = Number(account.current_balance);
      let newBalance;
      let transactionType: "Debit" | "Credit";

      // Determine transaction type and balance changes based on invoice type
      if (type === "Sale") {
        // For sales, we debit the account (increase receivables or cash)
        newBalance = previousBalance + Number(totalAmount);
        transactionType = "Debit";
      } else {
        // For purchases, we credit the account (increase payables or decrease cash)
        newBalance = previousBalance - Number(totalAmount);
        transactionType = "Credit";
      }

      // Update account balance
      await tx
        .update(accountsTable)
        .set({
          current_balance: newBalance.toString(),
          updated_at: new Date(),
        })
        .where(eq(accountsTable.id, account_id));

      // Create ledger entry
      await tx.insert(ledgersTable).values({
        id: uuidv4(),
        date: date ? new Date(date) : new Date(),
        account_id,
        invoice_id: invoiceId,
        transaction_type: transactionType,
        amount: totalAmount.toString(),
        description: `${type} invoice: ${invoice_no}`,
        previous_balance: previousBalance.toString(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      res.status(201).json({
        status: "success",
        message: `${type} invoice created successfully`,
        invoice: {
          ...invoice[0],
          items,
        },
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      next(new AppError("Internal server error", 500));
    }
  });
};

// Update an invoice
export const UpdateInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    // Only allow updating the description of an invoice
    // Other changes would require reversing all related transactions
    if (!description) {
      return next(new AppError("Description is required for update", 400));
    }

    const updatedInvoice = await db
      .update(invoicesTable)
      .set({ description, updated_at: new Date() })
      .where(eq(invoicesTable.id, id))
      .returning();

    if (!updatedInvoice.length) {
      return next(new AppError("Invoice not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Invoice updated successfully",
      invoice: updatedInvoice[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete an invoice (not recommended in production - should be a void operation instead)
export const DeleteInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    return next(
      new AppError(
        "Deleting invoices is not allowed. Create a return or void invoice instead.",
        400
      )
    );

    // This is commented out intentionally - deleting invoices in a financial system
    // is not recommended. Instead, implement a void or return process.
    const { id } = req.params;

    const deletedInvoice = await db
      .delete(invoicesTable)
      .where(eq(invoicesTable.id, id))
      .returning();

    if (!deletedInvoice.length) {
      return next(new AppError("Invoice not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

export const getNextInvoiceNumber = async (
  tx: any, // Using any for transaction type for simplicity
  type: "Sale" | "Purchase"
) => {
  try {
    // Query to get the latest invoice of the specified type
    const latestInvoice = await tx
      .select({ invoice_no: invoicesTable.invoice_no })
      .from(invoicesTable)
      .where(eq(invoicesTable.type, type))
      .orderBy(desc(invoicesTable.created_at))
      .limit(1);

    // If no previous invoice exists, start with a base number
    if (!latestInvoice.length) {
      return type === "Sale" ? "S-0001" : "P-0001";
    }

    // Extract the numeric part of the previous invoice number
    const prevInvoiceNo = latestInvoice[0].invoice_no;
    const prefix = type === "Sale" ? "S-" : "P-";
    const numericPart = prevInvoiceNo.split("-")[1];

    // Increment the number and pad with zeros
    const nextNumber = (parseInt(numericPart) + 1).toString().padStart(4, "0");

    return `${prefix}${nextNumber}`;
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    // Return a default in case of error
    return type === "Sale" ? "S-ERROR" : "P-ERROR";
  }
};
