import { Prisma, PrismaClient } from "../../generated/prisma";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import {generateNextCode} from "../utils/GenerateNextCode";

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
        ProductStock: true,
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Helper function to update parent account group balances recursively
// Keep recursion inside the same transaction
const updateParentGroupBalance = async (
  tx: Prisma.TransactionClient,
  accountGroupId: string,
  amount: number,
  userId: string
): Promise<void> => {
  const accountGroup = await tx.accountGroup.findUnique({
    where: { id: accountGroupId },
    select: {
      id: true,
      balance: true,
      parentId: true,
    },
  });

  if (!accountGroup) return;

  // Update current account group balance
  const currentBalance = parseFloat(accountGroup.balance?.toString() || "0");
  await tx.accountGroup.update({
    where: { id: accountGroup.id },
    data: {
      balance: currentBalance + amount,
      updatedBy: userId,
      updatedAt: new Date(),
    },
  });

  // Recursively update parent group balance if exists
  if (accountGroup.parentId) {
    await updateParentGroupBalance(tx, accountGroup.parentId, amount, userId);
  }
};

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
      // 1. Create product
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
      let totalStockValue = 0;

      // 2. If initial stocks provided
      if (Array.isArray(initialStocks) && initialStocks.length > 0) {
        const ledger = await tx.productBook.findFirst({
          where: { branchId },
          orderBy: { createdAt: "desc" },
        });

        if (!ledger) {
          throw new AppError("No product ledger found for branch", 400);
        }

        // 3. Group stocks by godownId
        const stockMap = new Map<
          string,
          { qty: number; thaan: number; rate: number }
        >();

        for (const stock of initialStocks) {
          const { godownId, qty = 0, thaan = 0, rate = 0 } = stock;
          if (!godownId || (qty === 0 && thaan === 0)) continue;

          if (!stockMap.has(godownId)) {
            stockMap.set(godownId, { qty, thaan, rate });
          } else {
            const existing = stockMap.get(godownId)!;
            const totalQty = existing.qty + qty;

            stockMap.set(godownId, {
              qty: totalQty,
              thaan: existing.thaan + thaan,
              rate:
                totalQty > 0
                  ? (existing.rate * existing.qty + rate * qty) / totalQty
                  : 0,
            });
          }
        }

        // 4. Create stock & ledger entries
        let runningQty = 0;
        let runningThaan = 0;

        const sortedEntries = Array.from(stockMap.entries()).sort(([a], [b]) =>
          a.localeCompare(b)
        );

        for (const [godownId, { qty, thaan, rate }] of sortedEntries) {
          const previousQty = runningQty;
          const previousThaan = runningThaan;

          // Create product stock
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

          // Create ledger entry
          await tx.productLedgerEntry.create({
            data: {
              productId: product.id,
              productBookId: ledger.id,
              godownId,
              type: "IN",
              date: new Date(),
              qty,
              thaan,
              previousQty,
              previousThaan,
              finalQty: previousQty + qty,
              finalThaan: previousThaan + thaan,
              rate,
              narration: "Opening Stock",
              createdBy: userId,
            },
          });

          runningQty += qty;
          runningThaan += thaan;
          totalQty += qty;
          totalThaan += thaan;
          totalStockValue += qty * rate;
        }

        const totalValue = Array.from(stockMap.values()).reduce(
          (acc, cur) => acc + cur.qty * cur.rate,
          0
        );

        const averageRate = totalQty > 0 ? totalValue / totalQty : 0;

        // 5. Update product with total stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            qty: totalQty,
            thaan: totalThaan,
            previousPurchaseRate: averageRate,
          },
        });

        // 6. Handle Journal Entry for Opening Stock (if stock value > 0)
        if (totalStockValue > 0) {
          // Find or create inventory ledger
          let inventoryLedger = await tx.ledger.findFirst({
            where: {
              branchId,
              type: "Inventory",
              isActive: true,
            },
          });

          // If no inventory ledger exists, create one
          if (!inventoryLedger) {
            // Find the inventory account group
            const inventoryAccountGroup = await tx.accountGroup.findFirst({
              where: {
                groupType: "CurrentAssets",
              },
            });

            if (!inventoryAccountGroup) {
              throw new AppError("Inventory account group not found", 400);
            }

            const code = await generateNextCode(
              tx,
              inventoryAccountGroup.code,
              branchId
            );

            inventoryLedger = await tx.ledger.create({
              data: {
                name: "Inventory",
                code,
                type: "Inventory",
                phone1: "",
                phone2: "",
                address: "",
                balance: 0,
                openingBalance: 0,
                accountGroupId: inventoryAccountGroup.id,
                branchId,
                createdBy: userId,
              },
            });
          }

          // Find or create Capital ledger for the credit entry
          let capitalLedger = await tx.ledger.findFirst({
            where: {
              branchId,
              type: "OwnerCapital",
              isActive: true,
            },
          });

          // If no opening balance ledger exists, create one
          if (!capitalLedger) {
            // Find equity account group
              const capitalAccountGroup = await tx.accountGroup.findFirst({
                  where: {
                      name: "Capital",
                  },
              });

              if (!capitalAccountGroup) {
                  throw new AppError("Capital account group not found", 400);
              }

            const capitalCode = await generateNextCode(
              tx,
              capitalAccountGroup.code,
              branchId
            );

            capitalLedger = await tx.ledger.create({
              data: {
                name: "Owner's Capital",
                code: capitalCode,
                type: "OwnerCapital",
                phone1: "",
                phone2: "",
                address: "",
                balance: 0,
                openingBalance: 0,
                accountGroupId: capitalAccountGroup.id,
                branchId,
                createdBy: userId,
              },
            });
          }

          // Get the journal book for this branch and financial year
          const journalBook = await tx.journalBook.findFirst({
            where: {
              branchId,
              isActive: true,
            },
            orderBy: { createdAt: "desc" },
          });

          if (!journalBook) {
            throw new AppError("No active journal book found for branch", 400);
          }

          // Get current balances
          const inventoryCurrentBalance = parseFloat(
            inventoryLedger.balance.toString()
          );
          const equityCurrentBalance = parseFloat(
            capitalLedger.balance.toString()
          );

          const currentDate = new Date();
          const narration = `Opening Stock for Product: ${product.name}`;

          // Create DEBIT journal entry for Inventory (Asset increase)
          await tx.journalEntry.create({
            data: {
              date: currentDate,
              journalBookId: journalBook.id,
              ledgerId: inventoryLedger.id,
              type: "DEBIT",
              amount: totalStockValue,
              preBalance: inventoryCurrentBalance,
              narration,
              createdBy: userId,
            },
          });

          // Create CREDIT journal entry for Opening Balance Equity (Equity increase)
          await tx.journalEntry.create({
            data: {
              date: currentDate,
              journalBookId: journalBook.id,
              ledgerId: capitalLedger.id,
              type: "CREDIT",
              amount: totalStockValue,
              preBalance: equityCurrentBalance,
              narration,
              createdBy: userId,
            },
          });

          // Update inventory ledger balance (Debit increases asset balance)
          await tx.ledger.update({
            where: { id: inventoryLedger.id },
            data: {
              balance: inventoryCurrentBalance + totalStockValue,
              updatedBy: userId,
            },
          });

          // Update opening balance equity ledger balance (Credit increases equity balance)
          await tx.ledger.update({
            where: { id: capitalLedger.id },
            data: {
              balance: equityCurrentBalance + totalStockValue,
              updatedBy: userId,
            },
          });

          // Update balance of their parents account
          await updateParentGroupBalance(
            tx,
            inventoryLedger.accountGroupId,
            totalStockValue,
            userId
          );
          await updateParentGroupBalance(
            tx,
            capitalLedger.accountGroupId,
            totalStockValue,
            userId
          );
        }
      }

      // 7. Return full product details
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
// export const transferGodownStock = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { productId, fromGodownId, toGodownId, quantity } = req.body;
//     let thaan = req.body.thaan;
//     if (thaan === undefined || thaan === null) thaan = 0;
//     const { id: userId } = req.user!;

//     if (!productId || !fromGodownId || !toGodownId || !quantity) {
//       return next(new AppError("All fields are required", 400));
//     }

//     // Check stock in fromGodown
//     const fromStock = await prisma.productStock.findFirst({
//       where: { productId, godownId: fromGodownId },
//     });

//     if (!fromStock || fromStock.qty < quantity || fromStock.thaan < thaan) {
//       return next(new AppError("Insufficient stock in source godown.", 400));
//     }

//     // Get latest product book for the branch
//     const product = await prisma.product.findUnique({
//       where: { id: productId },
//     });
//     if (!product) return next(new AppError("Product not found", 404));
//     const productBook = await prisma.productBook.findFirst({
//       where: { branchId: product.branchId },
//       orderBy: { createdAt: "desc" },
//     });
//     if (!productBook)
//       return next(new AppError("No product ledger found for branch", 400));

//     // Transaction for transfer
//     const transfer = await prisma.$transaction(async (tx) => {
//       // Deduct from source godown
//       await tx.productStock.update({
//         where: { id: fromStock.id },
//         data: { qty: { decrement: quantity }, thaan: { decrement: thaan } },
//       });

//       // Add to destination godown (create or update)
//       const toStock = await tx.productStock.findFirst({
//         where: { productId, godownId: toGodownId },
//       });

//       if (toStock) {
//         await tx.productStock.update({
//           where: { id: toStock.id },
//           data: { qty: { increment: quantity }, thaan: { increment: thaan } },
//         });
//       } else {
//         await tx.productStock.create({
//           data: {
//             productId,
//             godownId: toGodownId,
//             unitId: fromStock.unitId,
//             qty: quantity,
//             thaan: thaan,
//             createdBy: userId,
//           },
//         });
//       }

//       // Ledger entry: OUT from source godown
//       await tx.productLedgerEntry.create({
//         data: {
//           productId,
//           productBookId: productBook.id,
//           godownId: fromGodownId,
//           type: "OUT",
//           date: new Date(),
//           qty: quantity,
//           thaan: thaan,
//           narration: "Godown Transfer Out",
//           createdBy: userId,
//         },
//       });

//       // Ledger entry: IN to destination godown
//       await tx.productLedgerEntry.create({
//         data: {
//           productId,
//           productBookId: productBook.id,
//           godownId: toGodownId,
//           type: "IN",
//           date: new Date(),
//           qty: quantity,
//           thaan: thaan,
//           narration: "Godown Transfer In",
//           createdBy: userId,
//         },
//       });

//       // Create GodownTransfer record and link to productBook
//       return tx.godownTransfer.create({
//         data: {
//           productId,
//           fromGodownId,
//           toGodownId,
//           quantity,
//           thaan,
//           productBookId: productBook.id,
//           createdBy: userId,
//         },
//       });
//     });

//     res.status(200).json({ success: true, data: transfer });
//   } catch (error) {
//     next(error);
//   }
// };
