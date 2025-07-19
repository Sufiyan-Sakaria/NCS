import { PrismaClient } from "../../generated/prisma";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// GET product stock by branch, with optional godownId
export const getProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;
    const { godownId, productId } = req.query;

    // Build dynamic filter for productStock
    const stockWhere = {} as any;
    if (godownId) stockWhere.godownId = godownId;
    if (productId) {
      stockWhere.productId = productId;
    } else {
      stockWhere.product = { branchId };
    }

    const stocks = await prisma.productStock.findMany({
      where: stockWhere,
      select: {
        id: true,
        productId: true,
        godownId: true,
        qty: true,
        thaan: true,
        product: {
          select: {
            name: true,
            unit: { select: { name: true } },
            brand: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
        godown: { select: { name: true } },
      },
    });

    // Always aggregate by godown
    const aggregated = aggregateStockByGodown(stocks);

    // Calculate summary
    const totalQty = aggregated.reduce(
      (sum, e) => sum + (Number(e.qty) || 0),
      0
    );
    const totalThaan = aggregated.reduce(
      (sum, e) => sum + (Number(e.thaan) || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        entries: aggregated,
        totalEntries: aggregated.length,
        summary: {
          totalQty,
          totalThaan,
          currentQty: totalQty,
          currentThaan: totalThaan,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Aggregate stock by godown for a single product
export const aggregateStockByGodown = (stockData: any[]) => {
  return (stockData || []).reduce((acc: any[], row: any) => {
    // Use productId and godownId as the unique key
    const key = `${row.productId || row.product?.id || ""}-${
      row.godownId || row.godown?.id || ""
    }`;
    let found = acc.find((item) => item._key === key);
    if (!found) {
      found = {
        _key: key,
        productId: row.productId,
        product: row.product,
        godownId: row.godownId,
        godown: row.godown,
        qty: 0,
        thaan: 0,
      };
      acc.push(found);
    }
    found.qty += Number(row.qty) || 0;
    found.thaan += Number(row.thaan) || 0;
    return acc;
  }, []);
};

// GET all products by branch
export const getProductsByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const products = await prisma.product.findMany({
      where: { branchId, isActive: true },
      include: {
        brand: true,
        category: true,
        unit: true,
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// CREATE product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, unitId, brandId, categoryId, saleRate, initialStocks } =
    req.body;
  const { branchId } = req.params;
  const { id: userId } = req.user!;

  if (
    !name ||
    !unitId ||
    !brandId ||
    !categoryId ||
    !branchId ||
    saleRate == null
  ) {
    return next(new AppError("Missing required fields", 400));
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create product
      const product = await tx.product.create({
        data: {
          name,
          unitId,
          brandId,
          categoryId,
          saleRate,
          branchId,
          createdBy: userId,
        },
      });

      let totalQty = 0;
      let totalThaan = 0;

      if (Array.isArray(initialStocks) && initialStocks.length > 0) {
        // Get latest product book
        const ledger = await tx.productBook.findFirst({
          where: { branchId },
          orderBy: { createdAt: "desc" },
        });

        if (!ledger) {
          throw new AppError("No product ledger found for branch", 400);
        }

        // Insert stock and ledger entries
        for (const stock of initialStocks) {
          const { godownId, qty = 0, thaan = 0 } = stock;
          if (!godownId || (qty === 0 && thaan === 0)) continue;

          await tx.productStock.create({
            data: {
              productId: product.id,
              unitId,
              godownId,
              qty,
              thaan,
              createdBy: userId,
            },
          });

          await tx.productLedgerEntry.create({
            data: {
              productId: product.id,
              productBookId: ledger.id,
              godownId,
              type: "IN",
              date: new Date(),
              qty,
              thaan,
              narration: "Opening Stock",
              createdBy: userId,
            },
          });

          totalQty += qty;
          totalThaan += thaan;
        }

        // Update qty and thaan if there were valid stocks
        await tx.product.update({
          where: { id: product.id },
          data: {
            qty: totalQty,
            thaan: totalThaan,
          },
        });
      }

      // Fetch and return updated product
      const updatedProduct = await tx.product.findUnique({
        where: { id: product.id },
        include: {
          brand: true,
          category: true,
          unit: true,
          createdByUser: { select: { id: true, name: true } },
        },
      });

      return updatedProduct;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// UPDATE product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, unitId, brandId, categoryId, saleRate } = req.body;
    const { id: userId } = req.user!;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || !product.isActive) {
      return next(new AppError("Product not found", 404));
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        unitId,
        brandId,
        categoryId,
        saleRate,
        updatedBy: userId,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// TOGGLE active status
export const toggleProductStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return next(new AppError("Product not found", 404));

    const updated = await prisma.product.update({
      where: { id },
      data: {
        isActive: !product.isActive,
        updatedBy,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE (hard) product
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return next(new AppError("Product not found", 404));

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// TRANSFER stock between godowns
export const transferGodownStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId, fromGodownId, toGodownId, quantity } = req.body;
    let thaan = req.body.thaan;
    if (thaan === undefined || thaan === null) thaan = 0;
    const { id: userId } = req.user!;

    if (!productId || !fromGodownId || !toGodownId || !quantity) {
      return next(new AppError("All fields are required", 400));
    }

    // Check stock in fromGodown
    const fromStock = await prisma.productStock.findFirst({
      where: { productId, godownId: fromGodownId },
    });

    if (!fromStock || fromStock.qty < quantity || fromStock.thaan < thaan) {
      return next(new AppError("Insufficient stock in source godown.", 400));
    }

    // Get latest product book for the branch
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return next(new AppError("Product not found", 404));
    const productBook = await prisma.productBook.findFirst({
      where: { branchId: product.branchId },
      orderBy: { createdAt: "desc" },
    });
    if (!productBook)
      return next(new AppError("No product ledger found for branch", 400));

    // Transaction for transfer
    const transfer = await prisma.$transaction(async (tx) => {
      // Deduct from source godown
      await tx.productStock.update({
        where: { id: fromStock.id },
        data: { qty: { decrement: quantity }, thaan: { decrement: thaan } },
      });

      // Add to destination godown (create or update)
      const toStock = await tx.productStock.findFirst({
        where: { productId, godownId: toGodownId },
      });

      if (toStock) {
        await tx.productStock.update({
          where: { id: toStock.id },
          data: { qty: { increment: quantity }, thaan: { increment: thaan } },
        });
      } else {
        await tx.productStock.create({
          data: {
            productId,
            godownId: toGodownId,
            unitId: fromStock.unitId,
            qty: quantity,
            thaan: thaan,
            createdBy: userId,
          },
        });
      }

      // Ledger entry: OUT from source godown
      await tx.productLedgerEntry.create({
        data: {
          productId,
          productBookId: productBook.id,
          godownId: fromGodownId,
          type: "OUT",
          date: new Date(),
          qty: quantity,
          thaan: thaan,
          narration: "Godown Transfer Out",
          createdBy: userId,
        },
      });

      // Ledger entry: IN to destination godown
      await tx.productLedgerEntry.create({
        data: {
          productId,
          productBookId: productBook.id,
          godownId: toGodownId,
          type: "IN",
          date: new Date(),
          qty: quantity,
          thaan: thaan,
          narration: "Godown Transfer In",
          createdBy: userId,
        },
      });

      // Create GodownTransfer record and link to productBook
      return tx.godownTransfer.create({
        data: {
          productId,
          fromGodownId,
          toGodownId,
          quantity,
          thaan,
          productBookId: productBook.id,
          createdBy: userId,
        },
      });
    });

    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
};
