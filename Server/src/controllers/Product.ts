import { PrismaClient } from "../../generated/prisma";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

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
