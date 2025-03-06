import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import {
  productsTable,
  productLocationsTable,
  godownsTable,
  brandsTable,
  categoriesTable,
  itemLedgersTable,
  itemTransactionTypeEnum, // Added import for item ledger table
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "../utils/AppError";
import { randomUUID } from "crypto";
import { datetime } from "drizzle-orm/mysql-core";
import { DateTime } from "luxon";

// Fetch all products with brand and category info
export const GetAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allProducts = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brand_id,
        brandName: brandsTable.name,
        categoryId: productsTable.category_id,
        categoryName: categoriesTable.name,
        unit: productsTable.unit,
        price: productsTable.price,
        cost_price: productsTable.cost_price,
        thaan: productsTable.thaan,
        quantity: productsTable.quantity,
        created_at: productsTable.created_at,
        updated_at: productsTable.updated_at,
      })
      .from(productsTable)
      .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
      .leftJoin(
        categoriesTable,
        eq(productsTable.category_id, categoriesTable.id)
      );

    if (!allProducts.length) {
      return next(new AppError("No products found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Products fetched successfully",
      products: allProducts,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single product by id with stock information, brand and category
export const GetSingleProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brand_id,
        brandName: brandsTable.name,
        categoryId: productsTable.category_id,
        categoryName: categoriesTable.name,
        unit: productsTable.unit,
        price: productsTable.price,
        cost_price: productsTable.cost_price,
        thaan: productsTable.thaan,
        quantity: productsTable.quantity,
        created_at: productsTable.created_at,
        updated_at: productsTable.updated_at,
      })
      .from(productsTable)
      .where(eq(productsTable.id, Number(req.params.id)))
      .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
      .leftJoin(
        categoriesTable,
        eq(productsTable.category_id, categoriesTable.id)
      );

    if (!product.length) {
      return next(new AppError("Product not found", 404));
    }

    // Get stock information by godown
    const stockByLocation = await db
      .select({
        locationId: productLocationsTable.id,
        godownId: productLocationsTable.godown_id,
        godownName: godownsTable.name,
        quantity: productLocationsTable.quantity,
      })
      .from(productLocationsTable)
      .where(eq(productLocationsTable.product_id, Number(req.params.id)))
      .leftJoin(
        godownsTable,
        eq(productLocationsTable.godown_id, godownsTable.id)
      );

    res.status(200).json({
      status: "success",
      message: "Product fetched successfully",
      product: product[0],
      stockByLocation: stockByLocation,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create a new product with brand and category
export const CreateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      brand_id,
      category_id,
      unit,
      price,
      cost_price,
      thaan,
      quantity,
      initialStock,
    } = req.body;

    if (!name) {
      return next(new AppError("Product name is required", 400));
    }

    if (!brand_id) {
      return next(new AppError("Brand ID is required", 400));
    }

    if (!category_id) {
      return next(new AppError("Category ID is required", 400));
    }

    // Check if brand exists
    const brand = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, brand_id));

    if (!brand.length) {
      return next(new AppError("Brand not found", 404));
    }

    // Check if category exists
    const category = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category_id));

    if (!category.length) {
      return next(new AppError("Category not found", 404));
    }

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the product first
      const newProduct = await tx
        .insert(productsTable)
        .values({
          name,
          description,
          brand_id,
          category_id,
          unit: unit || "PCS",
          price: price || "0",
          cost_price: cost_price || "0",
          thaan: thaan || "0",
          quantity: quantity || "0",
        })
        .returning();

      // Fixed variable name: using newProduct[0].id
      const productId = newProduct[0].id;

      // If initial stock information is provided, add it to product_locations
      if (
        initialStock &&
        Array.isArray(initialStock) &&
        initialStock.length > 0
      ) {
        const stockEntries = initialStock.map((entry) => ({
          product_id: productId,
          godown_id: entry.godown_id,
          quantity: entry.quantity || "0",
          thaan: entry.thaan || "0",
        }));

        // Insert product locations
        const insertedLocations = await tx
          .insert(productLocationsTable)
          .values(stockEntries)
          .returning();

        // Create item ledger entries for initial stock
        for (const location of insertedLocations) {
          await tx.insert(itemLedgersTable).values({
            id: randomUUID(),
            date: DateTime.now().setZone("Asia/Karachi").toJSDate(),
            product_id: productId,
            godown_id: location.godown_id,
            transaction_type: "Opening", // This is from the itemTransactionTypeEnum - using the actual enum value instead of string
            quantity_in: location.quantity,
            quantity_out: "0",
            thaan_in: location.thaan || "0",
            thaan_out: "0",
            unit_price: newProduct[0].cost_price,
            total_amount: String(
              parseFloat(location.quantity.toString()) *
                parseFloat(newProduct[0].cost_price.toString())
            ),
            previous_quantity: "0",
            previous_thaan: "0",
            description: "Initial stock entry",
          });
        }

        // Calculate and update the total quantity and thaan in the product table
        const totalQuantity = initialStock
          .reduce((sum, entry) => sum + (parseFloat(entry.quantity) || 0), 0)
          .toString();

        const totalThaan = initialStock
          .reduce((sum, entry) => sum + (parseFloat(entry.thaan) || 0), 0)
          .toString();

        await tx
          .update(productsTable)
          .set({
            quantity: totalQuantity,
            thaan: totalThaan,
          })
          .where(eq(productsTable.id, Number(productId)));
      }

      // Fetch the newly created product with brand and category info
      const createdProductWithDetails = await tx
        .select({
          id: productsTable.id,
          name: productsTable.name,
          description: productsTable.description,
          brandId: productsTable.brand_id,
          brandName: brandsTable.name,
          categoryId: productsTable.category_id,
          categoryName: categoriesTable.name,
          unit: productsTable.unit,
          price: productsTable.price,
          cost_price: productsTable.cost_price,
          thaan: productsTable.thaan,
          quantity: productsTable.quantity,
          created_at: productsTable.created_at,
          updated_at: productsTable.updated_at,
        })
        .from(productsTable)
        .where(eq(productsTable.id, Number(productId)))
        .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
        .leftJoin(
          categoriesTable,
          eq(productsTable.category_id, categoriesTable.id)
        );

      res.status(201).json({
        status: "success",
        message: "Product created successfully",
        product: createdProductWithDetails[0],
      });
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update an existing product
export const UpdateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      brand_id,
      category_id,
      unit,
      price,
      cost_price,
      thaan,
      quantity,
    } = req.body;

    if (!Object.keys(req.body).length) {
      return next(
        new AppError("At least one field is required for update", 400)
      );
    }

    // Check if brand exists if being updated
    if (brand_id) {
      const brand = await db
        .select()
        .from(brandsTable)
        .where(eq(brandsTable.id, brand_id));

      if (!brand.length) {
        return next(new AppError("Brand not found", 404));
      }
    }

    // Check if category exists if being updated
    if (category_id) {
      const category = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, category_id));

      if (!category.length) {
        return next(new AppError("Category not found", 404));
      }
    }

    const updateValues = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(brand_id && { brand_id }),
      ...(category_id && { category_id }),
      ...(unit && { unit }),
      ...(price && { price }),
      ...(cost_price && { cost_price }),
      ...(thaan && { thaan }),
      ...(quantity && { quantity }),
    };

    const updatedProduct = await db
      .update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, Number(id)))
      .returning();

    if (!updatedProduct.length) {
      return next(new AppError("Product not found", 404));
    }

    // Get updated product with brand and category info
    const productWithDetails = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brand_id,
        brandName: brandsTable.name,
        categoryId: productsTable.category_id,
        categoryName: categoriesTable.name,
        unit: productsTable.unit,
        price: productsTable.price,
        cost_price: productsTable.cost_price,
        thaan: productsTable.thaan,
        quantity: productsTable.quantity,
        created_at: productsTable.created_at,
        updated_at: productsTable.updated_at,
      })
      .from(productsTable)
      .where(eq(productsTable.id, Number(id)))
      .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
      .leftJoin(
        categoriesTable,
        eq(productsTable.category_id, categoriesTable.id)
      );

    res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      product: productWithDetails[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete a product and its location records
export const DeleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    return await db.transaction(async (tx) => {
      // Delete associated item ledger entries first
      await tx
        .delete(itemLedgersTable)
        .where(eq(itemLedgersTable.product_id, Number(id)));

      // Delete location records
      await tx
        .delete(productLocationsTable)
        .where(eq(productLocationsTable.product_id, Number(id)));

      // Then delete the product
      const deletedProduct = await tx
        .delete(productsTable)
        .where(eq(productsTable.id, Number(id)))
        .returning();

      if (!deletedProduct.length) {
        return next(new AppError("Product not found", 404));
      }

      res.status(200).json({
        status: "success",
        message: "Product and its associated data deleted successfully",
      });
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update product stock in a specific godown
export const UpdateProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, godownId } = req.params;
    const { quantity, thaan, reason = "Stock adjustment" } = req.body;

    if (quantity === undefined && thaan === undefined) {
      return next(new AppError("Quantity or thaan is required", 400));
    }

    // Check if product exists
    const product = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, Number(productId)));

    if (!product.length) {
      return next(new AppError("Product not found", 404));
    }

    // Check if godown exists
    const godown = await db
      .select()
      .from(godownsTable)
      .where(eq(godownsTable.id, Number(godownId)));

    if (!godown.length) {
      return next(new AppError("Godown not found", 404));
    }

    return await db.transaction(async (tx) => {
      // Check if product location record exists
      const existingLocation = await tx
        .select()
        .from(productLocationsTable)
        .where(
          and(
            eq(productLocationsTable.product_id, Number(productId)),
            eq(productLocationsTable.godown_id, Number(godownId))
          )
        );

      let updatedLocation;
      let updateValues: any = {};
      let previousQuantity = "0";
      let previousThaan = "0";
      let quantityIn = "0";
      let quantityOut = "0";
      let thaanIn = "0";
      let thaanOut = "0";

      if (quantity !== undefined) {
        updateValues.quantity = quantity;
      }

      if (thaan !== undefined) {
        updateValues.thaan = thaan;
      }

      if (existingLocation.length) {
        // Calculate quantity differences for the ledger entry
        previousQuantity = existingLocation[0].quantity.toString();
        previousThaan = existingLocation[0].thaan?.toString() || "0";

        if (quantity !== undefined) {
          const quantityDiff =
            parseFloat(quantity) - parseFloat(previousQuantity);
          if (quantityDiff > 0) {
            quantityIn = quantityDiff.toString();
          } else if (quantityDiff < 0) {
            quantityOut = Math.abs(quantityDiff).toString();
          }
        }

        if (thaan !== undefined) {
          const thaanDiff = parseFloat(thaan) - parseFloat(previousThaan);
          if (thaanDiff > 0) {
            thaanIn = thaanDiff.toString();
          } else if (thaanDiff < 0) {
            thaanOut = Math.abs(thaanDiff).toString();
          }
        }

        // Update existing record
        updatedLocation = await tx
          .update(productLocationsTable)
          .set(updateValues)
          .where(
            and(
              eq(productLocationsTable.product_id, Number(productId)),
              eq(productLocationsTable.godown_id, Number(godownId))
            )
          )
          .returning();
      } else {
        // Create new record with default values for any missing fields
        updateValues.id = randomUUID();
        updateValues.product_id = Number(productId);
        updateValues.godown_id = Number(godownId);
        updateValues.quantity = updateValues.quantity || "0";
        updateValues.thaan = updateValues.thaan || "0";

        // For new locations, all stock is incoming
        if (quantity !== undefined) {
          quantityIn = quantity;
        }

        if (thaan !== undefined) {
          thaanIn = thaan;
        }

        updatedLocation = await tx
          .insert(productLocationsTable)
          .values(updateValues)
          .returning();
      }

      // Create an item ledger entry for this stock adjustment
      if (
        parseFloat(quantityIn) > 0 ||
        parseFloat(quantityOut) > 0 ||
        parseFloat(thaanIn) > 0 ||
        parseFloat(thaanOut) > 0
      ) {
        await tx.insert(itemLedgersTable).values({
          id: randomUUID(),
          date: new Date(),
          product_id: Number(productId),
          godown_id: Number(godownId),
          transaction_type: "Adjustment", // From itemTransactionTypeEnum
          quantity_in: quantityIn,
          quantity_out: quantityOut,
          thaan_in: thaanIn,
          thaan_out: thaanOut,
          unit_price: product[0].cost_price,
          total_amount: String(
            parseFloat(quantityIn || "0") *
              parseFloat(product[0].cost_price.toString())
          ),
          previous_quantity: previousQuantity,
          previous_thaan: previousThaan,
          description: reason || "Manual stock adjustment",
        });
      }

      // Update total quantity and thaan in product table
      const allLocations = await tx
        .select({
          quantity: productLocationsTable.quantity,
          thaan: productLocationsTable.thaan,
        })
        .from(productLocationsTable)
        .where(eq(productLocationsTable.product_id, Number(productId)));

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
        .where(eq(productsTable.id, Number(productId)));

      res.status(200).json({
        status: "success",
        message: "Product stock updated successfully",
        location: updatedLocation[0],
        totalQuantity,
        totalThaan,
      });
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Get stock status for all godowns for a product
export const GetProductStockByGodowns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        brandId: productsTable.brand_id,
        brandName: brandsTable.name,
        categoryId: productsTable.category_id,
        categoryName: categoriesTable.name,
        unit: productsTable.unit,
        price: productsTable.price,
        cost_price: productsTable.cost_price,
        thaan: productsTable.thaan,
        quantity: productsTable.quantity,
      })
      .from(productsTable)
      .where(eq(productsTable.id, Number(productId)))
      .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
      .leftJoin(
        categoriesTable,
        eq(productsTable.category_id, categoriesTable.id)
      );

    if (!product.length) {
      return next(new AppError("Product not found", 404));
    }

    // Get all godowns
    const allGodowns = await db.select().from(godownsTable);

    // Get existing stock records
    const stockRecords = await db
      .select({
        locationId: productLocationsTable.id,
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

    // Create a complete stock map including godowns with zero stock
    const completeStockMap = allGodowns.map((godown) => {
      const existingRecord = stockRecords.find(
        (record) => record.godownId === godown.id
      );

      return (
        existingRecord || {
          locationId: null,
          godownId: godown.id,
          godownName: godown.name,
          quantity: "0",
          thaan: "0",
        }
      );
    });

    res.status(200).json({
      status: "success",
      message: "Product stock fetched successfully",
      product: product[0],
      stockByGodown: completeStockMap,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Transfer stock between godowns
export const TransferStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { fromGodownId, toGodownId, quantity, thaan, description } = req.body;

    if (!fromGodownId || !toGodownId) {
      return next(
        new AppError(
          "Missing required fields: fromGodownId and toGodownId are required",
          400
        )
      );
    }

    if (!quantity && !thaan) {
      return next(
        new AppError(
          "Either quantity or thaan (or both) must be provided for transfer",
          400
        )
      );
    }

    if (fromGodownId === toGodownId) {
      return next(
        new AppError("Source and destination godowns cannot be the same", 400)
      );
    }

    // Parse values (if provided)
    const quantityNum = quantity ? parseFloat(quantity) : 0;
    const thaanNum = thaan ? parseFloat(thaan) : 0;

    if (
      (quantity && (isNaN(quantityNum) || quantityNum <= 0)) ||
      (thaan && (isNaN(thaanNum) || thaanNum <= 0))
    ) {
      return next(
        new AppError("Quantity and thaan must be positive numbers", 400)
      );
    }

    return await db.transaction(async (tx) => {
      // Check if product exists
      const product = await tx
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, Number(productId)));

      if (!product.length) {
        return next(new AppError("Product not found", 404));
      }

      // Check source godown stock
      const sourceStock = await tx
        .select()
        .from(productLocationsTable)
        .where(
          and(
            eq(productLocationsTable.product_id, Number(productId)),
            eq(productLocationsTable.godown_id, Number(fromGodownId))
          )
        );

      if (!sourceStock.length) {
        return next(new AppError("No stock found in source godown", 404));
      }

      // Validate enough quantity
      if (quantity) {
        const sourceQuantity = parseFloat(sourceStock[0].quantity.toString());
        if (sourceQuantity < quantityNum) {
          return next(
            new AppError("Insufficient quantity in source godown", 400)
          );
        }
      }

      // Validate enough thaan
      if (thaan) {
        const sourceThaan = parseFloat(sourceStock[0].thaan?.toString() || "0");
        if (sourceThaan < thaanNum) {
          return next(new AppError("Insufficient thaan in source godown", 400));
        }
      }

      // Store previous values for ledger entries
      const sourceQuantityBefore = parseFloat(
        sourceStock[0].quantity.toString()
      );
      const sourceThaanBefore = parseFloat(
        sourceStock[0].thaan?.toString() || "0"
      );

      // Update source godown (subtract)
      const updateSourceValues: any = {};

      if (quantity) {
        updateSourceValues.quantity = (
          sourceQuantityBefore - quantityNum
        ).toString();
      }

      if (thaan) {
        updateSourceValues.thaan = (sourceThaanBefore - thaanNum).toString();
      }

      await tx
        .update(productLocationsTable)
        .set(updateSourceValues)
        .where(
          and(
            eq(productLocationsTable.product_id, Number(productId)),
            eq(productLocationsTable.godown_id, Number(fromGodownId))
          )
        );

      // Check target godown stock
      const targetStock = await tx
        .select()
        .from(productLocationsTable)
        .where(
          and(
            eq(productLocationsTable.product_id, Number(productId)),
            eq(productLocationsTable.godown_id, Number(toGodownId))
          )
        );

      let targetQuantityBefore = 0;
      let targetThaanBefore = 0;

      if (targetStock.length) {
        // Store previous values for ledger entries
        targetQuantityBefore = parseFloat(targetStock[0].quantity.toString());
        targetThaanBefore = parseFloat(targetStock[0].thaan?.toString() || "0");

        // Update existing target record
        const updateTargetValues: any = {};

        if (quantity) {
          updateTargetValues.quantity = (
            targetQuantityBefore + quantityNum
          ).toString();
        }

        if (thaan) {
          updateTargetValues.thaan = (targetThaanBefore + thaanNum).toString();
        }

        await tx
          .update(productLocationsTable)
          .set(updateTargetValues)
          .where(
            and(
              eq(productLocationsTable.product_id, Number(productId)),
              eq(productLocationsTable.godown_id, Number(toGodownId))
            )
          );
      } else {
        // Create new target record
        await tx.insert(productLocationsTable).values({
          product_id: Number(productId),
          godown_id: Number(toGodownId),
          quantity: quantity ? quantityNum.toString() : "0",
          thaan: thaan ? thaanNum.toString() : "0",
        });
      }

      // Create item ledger entries for the transfer (one for source and one for destination)
      const transferDate = new Date();
      const transferDesc = description || "Stock transfer between godowns";
      const unitPrice = product[0].cost_price;

      // Create ledger entry for source godown (outgoing)
      await tx.insert(itemLedgersTable).values({
        id: randomUUID(),
        date: transferDate,
        product_id: Number(productId),
        godown_id: Number(fromGodownId),
        transaction_type: "Transfer", // From itemTransactionTypeEnum
        quantity_in: "0",
        quantity_out: quantity || "0",
        thaan_in: "0",
        thaan_out: thaan || "0",
        unit_price: unitPrice,
        total_amount: String(
          parseFloat(quantity || "0") * parseFloat(unitPrice.toString())
        ),
        previous_quantity: sourceQuantityBefore.toString(),
        previous_thaan: sourceThaanBefore.toString(),
        description: `${transferDesc} (Outgoing to Godown #${toGodownId})`,
      });

      // Create ledger entry for destination godown (incoming)
      await tx.insert(itemLedgersTable).values({
        id: randomUUID(),
        date: transferDate,
        product_id: Number(productId),
        godown_id: Number(toGodownId),
        transaction_type: "Transfer", // From itemTransactionTypeEnum
        quantity_in: quantity || "0",
        quantity_out: "0",
        thaan_in: thaan || "0",
        thaan_out: "0",
        unit_price: unitPrice,
        total_amount: String(
          parseFloat(quantity || "0") * parseFloat(unitPrice.toString())
        ),
        previous_quantity: targetQuantityBefore.toString(),
        previous_thaan: targetThaanBefore.toString(),
        description: `${transferDesc} (Incoming from Godown #${fromGodownId})`,
      });

      // Update total quantity and thaan in product table
      const allLocations = await tx
        .select({
          quantity: productLocationsTable.quantity,
          thaan: productLocationsTable.thaan,
        })
        .from(productLocationsTable)
        .where(eq(productLocationsTable.product_id, Number(productId)));

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
        .where(eq(productsTable.id, Number(productId)));

      // Return success response
      res.status(200).json({
        status: "success",
        message: "Stock transferred successfully",
        data: {
          productId: Number(productId),
          fromGodownId: Number(fromGodownId),
          toGodownId: Number(toGodownId),
          quantity: quantity || "0",
          thaan: thaan || "0",
          description: transferDesc,
        },
      });
    });
  } catch (error) {
    console.error("Error transferring stock:", error);
    return next(new AppError("Failed to transfer stock", 500));
  }
};
