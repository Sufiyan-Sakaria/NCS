import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import {
  productsTable,
  productLocationsTable,
  godownsTable,
  itemLedgersTable,
  invoicesTable,
  returnsTable,
} from "../db/schema";
import { eq, and, desc, lte, gte } from "drizzle-orm";
import { AppError } from "../utils/AppError";
import { randomUUID } from "crypto";

// Create a new item ledger entry
export const CreateItemLedgerEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      product_id,
      godown_id,
      transaction_type,
      quantity_in,
      quantity_out,
      thaan_in,
      thaan_out,
      unit_price,
      total_amount,
      invoice_id,
      return_id,
      date,
      description,
    } = req.body;

    if (!product_id || !godown_id || !transaction_type) {
      return next(
        new AppError(
          "Product ID, Godown ID, and Transaction Type are required",
          400
        )
      );
    }

    // Validate transaction type has proper quantity values
    if (
      (transaction_type === "Sale" ||
        transaction_type === "PurchaseReturn" ||
        transaction_type === "Transfer") &&
      (!quantity_out || parseFloat(quantity_out) <= 0) &&
      (!thaan_out || parseFloat(thaan_out) <= 0)
    ) {
      return next(
        new AppError(
          "For outgoing transactions, either quantity_out or thaan_out must be positive",
          400
        )
      );
    }

    if (
      (transaction_type === "Purchase" ||
        transaction_type === "SaleReturn" ||
        transaction_type === "Opening") &&
      (!quantity_in || parseFloat(quantity_in) <= 0) &&
      (!thaan_in || parseFloat(thaan_in) <= 0)
    ) {
      return next(
        new AppError(
          "For incoming transactions, either quantity_in or thaan_in must be positive",
          400
        )
      );
    }

    // Check if product exists
    const product = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, Number(product_id)));

    if (!product.length) {
      return next(new AppError("Product not found", 404));
    }

    // Check if godown exists
    const godown = await db
      .select()
      .from(godownsTable)
      .where(eq(godownsTable.id, Number(godown_id)));

    if (!godown.length) {
      return next(new AppError("Godown not found", 404));
    }

    // If invoice_id is provided, check if it exists
    if (invoice_id) {
      const invoice = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.id, invoice_id));

      if (!invoice.length) {
        return next(new AppError("Invoice not found", 404));
      }
    }

    // If return_id is provided, check if it exists
    if (return_id) {
      const returnRecord = await db
        .select()
        .from(returnsTable)
        .where(eq(returnsTable.id, return_id));

      if (!returnRecord.length) {
        return next(new AppError("Return not found", 404));
      }
    }

    return await db.transaction(async (tx) => {
      // Get the current quantity and thaan for the product in this godown
      const productLocation = await tx
        .select()
        .from(productLocationsTable)
        .where(
          and(
            eq(productLocationsTable.product_id, Number(product_id)),
            eq(productLocationsTable.godown_id, Number(godown_id))
          )
        );

      let previousQuantity = "0";
      let previousThaan = "0";
      let locationExists = false;

      if (productLocation.length) {
        previousQuantity = productLocation[0].quantity.toString();
        previousThaan = productLocation[0].thaan?.toString() || "0";
        locationExists = true;
      }

      // Create the item ledger entry
      const newItemLedger = await tx
        .insert(itemLedgersTable)
        .values({
          id: randomUUID(),
          date: date ? new Date(date) : new Date(),
          product_id: Number(product_id),
          godown_id: Number(godown_id),
          transaction_type,
          quantity_in: quantity_in || "0",
          quantity_out: quantity_out || "0",
          thaan_in: thaan_in || "0",
          thaan_out: thaan_out || "0",
          unit_price: unit_price || "0",
          total_amount: total_amount || "0",
          invoice_id: invoice_id || undefined,
          return_id: return_id || undefined,
          previous_quantity: previousQuantity,
          previous_thaan: previousThaan,
          description,
        })
        .returning();

      // Update product location (or create if it doesn't exist)
      const quantityInNum = parseFloat(quantity_in || "0");
      const quantityOutNum = parseFloat(quantity_out || "0");
      const thaanInNum = parseFloat(thaan_in || "0");
      const thaanOutNum = parseFloat(thaan_out || "0");

      const prevQuantityNum = parseFloat(previousQuantity);
      const prevThaanNum = parseFloat(previousThaan);

      const newQuantity = (
        prevQuantityNum +
        quantityInNum -
        quantityOutNum
      ).toString();
      const newThaan = (prevThaanNum + thaanInNum - thaanOutNum).toString();

      if (locationExists) {
        await tx
          .update(productLocationsTable)
          .set({
            quantity: newQuantity,
            thaan: newThaan,
          })
          .where(
            and(
              eq(productLocationsTable.product_id, Number(product_id)),
              eq(productLocationsTable.godown_id, Number(godown_id))
            )
          );
      } else {
        await tx.insert(productLocationsTable).values({
          product_id: Number(product_id),
          godown_id: Number(godown_id),
          quantity: newQuantity,
          thaan: newThaan,
        });
      }

      // Update total quantity and thaan in the product table
      const allLocations = await tx
        .select({
          quantity: productLocationsTable.quantity,
          thaan: productLocationsTable.thaan,
        })
        .from(productLocationsTable)
        .where(eq(productLocationsTable.product_id, Number(product_id)));

      const totalQuantity = allLocations
        .reduce((sum, loc) => sum + parseFloat(loc.quantity.toString()), 0)
        .toString();

      const totalThaan = allLocations
        .reduce((sum, loc) => sum + parseFloat(loc.thaan?.toString() || "0"), 0)
        .toString();

      await tx
        .update(productsTable)
        .set({
          quantity: totalQuantity,
          thaan: totalThaan,
        })
        .where(eq(productsTable.id, Number(product_id)));

      res.status(201).json({
        status: "success",
        message: "Item ledger entry created successfully",
        itemLedger: newItemLedger[0],
      });
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Get all item ledger entries for a product
export const GetProductItemLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { godownId, startDate, endDate } = req.query;

    // Check if product exists
    const product = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        unit: productsTable.unit,
      })
      .from(productsTable)
      .where(eq(productsTable.id, Number(productId)));

    if (!product.length) {
      return next(new AppError("Product not found", 404));
    }

    // Build the query conditions
    let conditions = [eq(itemLedgersTable.product_id, Number(productId))];

    if (godownId) {
      conditions.push(eq(itemLedgersTable.godown_id, Number(godownId)));
    }

    if (startDate) {
      conditions.push(
        gte(itemLedgersTable.date, new Date(startDate as string))
      );
    }

    if (endDate) {
      conditions.push(lte(itemLedgersTable.date, new Date(endDate as string)));
    }

    // Get the ledger entries
    const itemLedgerEntries = await db
      .select({
        id: itemLedgersTable.id,
        date: itemLedgersTable.date,
        godownId: itemLedgersTable.godown_id,
        godownName: godownsTable.name,
        transactionType: itemLedgersTable.transaction_type,
        quantityIn: itemLedgersTable.quantity_in,
        quantityOut: itemLedgersTable.quantity_out,
        thaanIn: itemLedgersTable.thaan_in,
        thaanOut: itemLedgersTable.thaan_out,
        unitPrice: itemLedgersTable.unit_price,
        totalAmount: itemLedgersTable.total_amount,
        invoiceId: itemLedgersTable.invoice_id,
        returnId: itemLedgersTable.return_id,
        previousQuantity: itemLedgersTable.previous_quantity,
        previousThaan: itemLedgersTable.previous_thaan,
        description: itemLedgersTable.description,
        createdAt: itemLedgersTable.created_at,
      })
      .from(itemLedgersTable)
      .where(and(...conditions))
      .leftJoin(godownsTable, eq(itemLedgersTable.godown_id, godownsTable.id))
      .orderBy(desc(itemLedgersTable.date));

    // Get current stock information
    const currentStock = await db
      .select({
        godownId: productLocationsTable.godown_id,
        godownName: godownsTable.name,
        quantity: productLocationsTable.quantity,
        thaan: productLocationsTable.thaan,
      })
      .from(productLocationsTable)
      .where(eq(productLocationsTable.product_id, Number(productId)))
      .leftJoin(
        godownsTable,
        eq(productLocationsTable.godown_id, godownsTable.id)
      );

    res.status(200).json({
      status: "success",
      message: "Item ledger entries fetched successfully",
      product: product[0],
      currentStock,
      itemLedger: itemLedgerEntries,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Get specific item ledger entry by ID
export const GetItemLedgerEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const itemLedgerEntry = await db
      .select({
        id: itemLedgersTable.id,
        date: itemLedgersTable.date,
        productId: itemLedgersTable.product_id,
        productName: productsTable.name,
        godownId: itemLedgersTable.godown_id,
        godownName: godownsTable.name,
        transactionType: itemLedgersTable.transaction_type,
        quantityIn: itemLedgersTable.quantity_in,
        quantityOut: itemLedgersTable.quantity_out,
        thaanIn: itemLedgersTable.thaan_in,
        thaanOut: itemLedgersTable.thaan_out,
        unitPrice: itemLedgersTable.unit_price,
        totalAmount: itemLedgersTable.total_amount,
        invoiceId: itemLedgersTable.invoice_id,
        returnId: itemLedgersTable.return_id,
        previousQuantity: itemLedgersTable.previous_quantity,
        previousThaan: itemLedgersTable.previous_thaan,
        description: itemLedgersTable.description,
        createdAt: itemLedgersTable.created_at,
      })
      .from(itemLedgersTable)
      .where(eq(itemLedgersTable.id, id))
      .leftJoin(
        productsTable,
        eq(itemLedgersTable.product_id, productsTable.id)
      )
      .leftJoin(godownsTable, eq(itemLedgersTable.godown_id, godownsTable.id));

    if (!itemLedgerEntry.length) {
      return next(new AppError("Item ledger entry not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Item ledger entry fetched successfully",
      itemLedger: itemLedgerEntry[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update item ledger entry and adjust inventory accordingly
export const UpdateItemLedgerEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      quantity_in,
      quantity_out,
      thaan_in,
      thaan_out,
      unit_price,
      total_amount,
      date,
      description,
    } = req.body;

    if (
      quantity_in === undefined &&
      quantity_out === undefined &&
      thaan_in === undefined &&
      thaan_out === undefined &&
      unit_price === undefined &&
      total_amount === undefined &&
      date === undefined &&
      description === undefined
    ) {
      return next(
        new AppError("At least one field is required for update", 400)
      );
    }

    return await db.transaction(async (tx) => {
      // Get the current ledger entry
      const currentLedger = await tx
        .select()
        .from(itemLedgersTable)
        .where(eq(itemLedgersTable.id, id));

      if (!currentLedger.length) {
        return next(new AppError("Item ledger entry not found", 404));
      }

      const ledgerEntry = currentLedger[0];
      const product_id = ledgerEntry.product_id;
      const godown_id = ledgerEntry.godown_id;

      // Get the current product location
      const productLocation = await tx
        .select()
        .from(productLocationsTable)
        .where(
          and(
            eq(productLocationsTable.product_id, product_id),
            eq(productLocationsTable.godown_id, godown_id)
          )
        );

      if (!productLocation.length) {
        return next(
          new AppError(
            "Product location not found, cannot update ledger entry",
            404
          )
        );
      }

      // Calculate the differences between old and new values
      const oldQuantityIn = parseFloat(ledgerEntry.quantity_in.toString());
      const oldQuantityOut = parseFloat(ledgerEntry.quantity_out.toString());
      const oldThaanIn = parseFloat(ledgerEntry.thaan_in?.toString() || "0");
      const oldThaanOut = parseFloat(ledgerEntry.thaan_out?.toString() || "0");

      const newQuantityIn = quantity_in
        ? parseFloat(quantity_in)
        : oldQuantityIn;
      const newQuantityOut = quantity_out
        ? parseFloat(quantity_out)
        : oldQuantityOut;
      const newThaanIn = thaan_in ? parseFloat(thaan_in) : oldThaanIn;
      const newThaanOut = thaan_out ? parseFloat(thaan_out) : oldThaanOut;

      // Calculate the net change in inventory
      const quantityChange =
        newQuantityIn - oldQuantityIn - (newQuantityOut - oldQuantityOut);
      const thaanChange = newThaanIn - oldThaanIn - (newThaanOut - oldThaanOut);

      // Update the ledger entry
      const updateValues: any = {};
      if (quantity_in !== undefined) updateValues.quantity_in = quantity_in;
      if (quantity_out !== undefined) updateValues.quantity_out = quantity_out;
      if (thaan_in !== undefined) updateValues.thaan_in = thaan_in;
      if (thaan_out !== undefined) updateValues.thaan_out = thaan_out;
      if (unit_price !== undefined) updateValues.unit_price = unit_price;
      if (total_amount !== undefined) updateValues.total_amount = total_amount;
      if (date !== undefined) updateValues.date = new Date(date);
      if (description !== undefined) updateValues.description = description;

      const updatedLedger = await tx
        .update(itemLedgersTable)
        .set(updateValues)
        .where(eq(itemLedgersTable.id, id))
        .returning();

      // Update the product location
      const currentQuantity = parseFloat(
        productLocation[0].quantity.toString()
      );
      const currentThaan = parseFloat(
        productLocation[0].thaan?.toString() || "0"
      );

      const newQuantity = (currentQuantity + quantityChange).toString();
      const newThaan = (currentThaan + thaanChange).toString();

      await tx
        .update(productLocationsTable)
        .set({
          quantity: newQuantity,
          thaan: newThaan,
        })
        .where(
          and(
            eq(productLocationsTable.product_id, product_id),
            eq(productLocationsTable.godown_id, godown_id)
          )
        );

      // Update total quantity and thaan in the product table
      const allLocations = await tx
        .select({
          quantity: productLocationsTable.quantity,
          thaan: productLocationsTable.thaan,
        })
        .from(productLocationsTable)
        .where(eq(productLocationsTable.product_id, product_id));

      const totalQuantity = allLocations
        .reduce((sum, loc) => sum + parseFloat(loc.quantity.toString()), 0)
        .toString();

      const totalThaan = allLocations
        .reduce((sum, loc) => sum + parseFloat(loc.thaan?.toString() || "0"), 0)
        .toString();

      await tx
        .update(productsTable)
        .set({
          quantity: totalQuantity,
          thaan: totalThaan,
        })
        .where(eq(productsTable.id, product_id));

      res.status(200).json({
        status: "success",
        message: "Item ledger entry updated successfully",
        itemLedger: updatedLedger[0],
      });
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete item ledger entry and adjust inventory accordingly
export const DeleteItemLedgerEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    return await db.transaction(async (tx) => {
      // Get the current ledger entry
      const currentLedger = await tx
        .select()
        .from(itemLedgersTable)
        .where(eq(itemLedgersTable.id, id));

      if (!currentLedger.length) {
        return next(new AppError("Item ledger entry not found", 404));
      }

      const ledgerEntry = currentLedger[0];
      const product_id = ledgerEntry.product_id;
      const godown_id = ledgerEntry.godown_id;

      // Get the current product location
      const productLocation = await tx
        .select()
        .from(productLocationsTable)
        .where(
          and(
            eq(productLocationsTable.product_id, product_id),
            eq(productLocationsTable.godown_id, godown_id)
          )
        );

      if (!productLocation.length) {
        return next(
          new AppError(
            "Product location not found, cannot delete ledger entry",
            404
          )
        );
      }

      // Calculate the impact on inventory when removing this entry
      const quantityIn = parseFloat(ledgerEntry.quantity_in.toString());
      const quantityOut = parseFloat(ledgerEntry.quantity_out.toString());
      const thaanIn = parseFloat(ledgerEntry.thaan_in?.toString() || "0");
      const thaanOut = parseFloat(ledgerEntry.thaan_out?.toString() || "0");

      // Current inventory
      const currentQuantity = parseFloat(
        productLocation[0].quantity.toString()
      );
      const currentThaan = parseFloat(
        productLocation[0].thaan?.toString() || "0"
      );

      // Calculate new inventory after deleting entry
      // When deleting, we need to reverse the effect of the entry
      const newQuantity = (
        currentQuantity -
        quantityIn +
        quantityOut
      ).toString();
      const newThaan = (currentThaan - thaanIn + thaanOut).toString();

      // Delete the ledger entry
      await tx.delete(itemLedgersTable).where(eq(itemLedgersTable.id, id));

      // Update the product location
      await tx
        .update(productLocationsTable)
        .set({
          quantity: newQuantity,
          thaan: newThaan,
        })
        .where(
          and(
            eq(productLocationsTable.product_id, product_id),
            eq(productLocationsTable.godown_id, godown_id)
          )
        );

      // Update total quantity and thaan in the product table
      const allLocations = await tx
        .select({
          quantity: productLocationsTable.quantity,
          thaan: productLocationsTable.thaan,
        })
        .from(productLocationsTable)
        .where(eq(productLocationsTable.product_id, product_id));

      const totalQuantity = allLocations
        .reduce((sum, loc) => sum + parseFloat(loc.quantity.toString()), 0)
        .toString();

      const totalThaan = allLocations
        .reduce((sum, loc) => sum + parseFloat(loc.thaan?.toString() || "0"), 0)
        .toString();

      await tx
        .update(productsTable)
        .set({
          quantity: totalQuantity,
          thaan: totalThaan,
        })
        .where(eq(productsTable.id, product_id));

      res.status(200).json({
        status: "success",
        message: "Item ledger entry deleted successfully",
      });
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Get item ledger summary for all products (grouped by product and godown)
export const GetItemLedgerSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, godownId } = req.query;

    // Build the query conditions
    let conditions = [];

    if (godownId) {
      conditions.push(eq(itemLedgersTable.godown_id, Number(godownId)));
    }

    if (startDate) {
      conditions.push(
        gte(itemLedgersTable.date, new Date(startDate as string))
      );
    }

    if (endDate) {
      conditions.push(lte(itemLedgersTable.date, new Date(endDate as string)));
    }

    // Get all entries that match the conditions
    const itemLedgerEntries = await db
      .select({
        productId: itemLedgersTable.product_id,
        productName: productsTable.name,
        godownId: itemLedgersTable.godown_id,
        godownName: godownsTable.name,
        quantityIn: itemLedgersTable.quantity_in,
        quantityOut: itemLedgersTable.quantity_out,
        thaanIn: itemLedgersTable.thaan_in,
        thaanOut: itemLedgersTable.thaan_out,
        totalAmount: itemLedgersTable.total_amount,
      })
      .from(itemLedgersTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .leftJoin(
        productsTable,
        eq(itemLedgersTable.product_id, productsTable.id)
      )
      .leftJoin(godownsTable, eq(itemLedgersTable.godown_id, godownsTable.id));

    // Group entries by product and godown
    const summaryMap = new Map();

    itemLedgerEntries.forEach((entry) => {
      const key = `${entry.productId}-${entry.godownId}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          productId: entry.productId,
          productName: entry.productName,
          godownId: entry.godownId,
          godownName: entry.godownName,
          totalQuantityIn: 0,
          totalQuantityOut: 0,
          totalThaanIn: 0,
          totalThaanOut: 0,
          totalAmount: 0,
        });
      }

      const summary = summaryMap.get(key);

      summary.totalQuantityIn += parseFloat(entry.quantityIn.toString());
      summary.totalQuantityOut += parseFloat(entry.quantityOut.toString());
      summary.totalThaanIn += parseFloat(entry.thaanIn?.toString() || "0");
      summary.totalThaanOut += parseFloat(entry.thaanOut?.toString() || "0");
      summary.totalAmount += parseFloat(entry.totalAmount?.toString() || "0");
    });

    // Convert map to array
    const summaryArray = Array.from(summaryMap.values());

    res.status(200).json({
      status: "success",
      message: "Item ledger summary fetched successfully",
      summary: summaryArray,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
