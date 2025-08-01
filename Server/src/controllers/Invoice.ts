import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import { EntryType, InvoiceType, Prisma } from "../../generated/prisma";
import { updateParentBalances } from "../utils/UpdateParentBalances";

const prisma = new PrismaClient();

// Get all invoices
export const getInvoicesByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { branchId } = req.params;

  try {
    if (!branchId) {
      return next(new AppError("Branch ID is required", 400));
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceBook: {
          branchId,
        },
      },
      include: {
        createdByUser: true,
        ledger: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error(error);
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
        items: {
          include: {
            product: {
              include: {
                unit: true,
                category: true,
                brand: true,
              },
            },
            godown: true,
          },
        },
        ledger: true,
        invoiceLedger: true,
        createdByUser: true,
        updatedByUser: true,
      },
    });
    if (!invoice) return next(new AppError("Invoice not found", 404));
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(new AppError("Failed to fetch invoice", 500));
  }
};

// Get Invoice No.
export const getInvoiceNumber = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { branchId } = req.params;
  const { type } = req.query;

  try {
    if (!branchId) {
      return next(new AppError("Branch ID is required", 400));
    }

    if (!type || typeof type !== "string" || !(type in InvoiceType)) {
      return next(new AppError("Invalid or missing invoice type", 400));
    }

    const invoiceType = type as InvoiceType;

    const invoiceBook = await prisma.invoiceBook.findFirst({
      where: { branchId, type: invoiceType },
      orderBy: { createdAt: "desc" },
    });

    if (!invoiceBook) {
      return next(new AppError("No invoice book found for this branch", 404));
    }

    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceBookId: invoiceBook.id, type: invoiceType },
      orderBy: { createdAt: "desc" },
    });

    const newInvoiceNumber = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber) + 1
      : 1;

    res.status(200).json({ success: true, data: newInvoiceNumber });
  } catch (error) {
    console.error(error);
    next(new AppError("Failed to fetch invoice number", 500));
  }
};

// Create invoice
export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    date,
    type,
    ledgerId,
    invoiceLedgerId,
    totalAmount,
    discount = 0,
    cartage = 0,
    grandTotal,
    narration,
    items,
  } = req.body;
  const { branchId } = req.params;
  const { id: userId } = req.user!;

  try {
    // ✅ Basic validations
    if (!date || !type || !ledgerId || !grandTotal || !items?.length) {
      return next(new AppError("Missing required fields", 400));
    }

    if (!Object.values(InvoiceType).includes(type)) {
      return next(new AppError("Invalid invoice type", 400));
    }

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 0. Get invoice book
        const invoiceBook = await tx.invoiceBook.findFirst({
          where: {
            branchId,
            type,
          },
          orderBy: { createdAt: "desc" },
        });

        // 1. Get last invoice number in this book
        const lastInvoice = await tx.invoice.findFirst({
          where: { invoiceBookId: invoiceBook?.id },
          orderBy: { createdAt: "desc" },
        });

        const newInvoiceNumber = lastInvoice
          ? parseInt(lastInvoice.invoiceNumber) + 1
          : 1;

        // Ensure the date is in ISO-8601 format
        const formattedDate = new Date(date).toISOString();

        for (const item of items) {
          if (!item.godownId) {
            throw new AppError("Each invoice item must have a godownId", 400);
          }

          const godown = await tx.godown.findUnique({
            where: { id: item.godownId },
          });

          if (!godown) {
            throw new AppError(`Invalid godownId: ${item.godownId}`, 400);
          }
        }

        // 2. Create invoice and items
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: newInvoiceNumber.toString(),
            date: formattedDate,
            type,
            invoiceBookId: invoiceBook!.id,
            ledgerId,
            invoiceLedgerId,
            totalAmount,
            discount,
            cartage,
            grandTotal,
            narration,
            createdBy: userId,
            items: {
              create: items,
            },
          },
          include: {
            items: true,
            invoiceBook: true,
          },
        });

        // 3. Get journal book (you can also pass it directly from client)
        const journalBook = await tx.journalBook.findFirst({
          where: {
            branchId: branchId,
            financialYearId: invoice.invoiceBook.financialYearId,
          },
        });

        if (!journalBook) {
          throw new AppError(
            "No journal book found for this invoice book",
            400
          );
        }

        // 4. Prepare dynamic journal entries
        let debitLedgerId: string;
        let creditLedgerId: string;

        switch (type) {
          case "SALE":
            debitLedgerId = ledgerId; // customer
            creditLedgerId = invoiceLedgerId!;
            break;
          case "PURCHASE":
            debitLedgerId = invoiceLedgerId!;
            creditLedgerId = ledgerId; // supplier
            break;
          case "SALE_RETURN":
            debitLedgerId = invoiceLedgerId!;
            creditLedgerId = ledgerId;
            break;
          case "PURCHASE_RETURN":
            debitLedgerId = ledgerId;
            creditLedgerId = invoiceLedgerId!;
            break;
          default:
            throw new AppError("Unsupported invoice type", 400);
        }

        const debitLedger = await tx.ledger.findUnique({
          where: { id: debitLedgerId },
        });
        const creditLedger = await tx.ledger.findUnique({
          where: { id: creditLedgerId },
        });

        if (!debitLedger || !creditLedger) {
          throw new AppError("One or both ledgers not found", 404);
        }

        const journalEntries = [
          {
            date: formattedDate,
            journalBookId: journalBook.id,
            ledgerId: debitLedgerId,
            type: EntryType.DEBIT,
            amount: grandTotal,
            preBalance: debitLedger.balance.toNumber(),
            narration: `Invoice ${newInvoiceNumber} - ${type}`,
            createdBy: userId,
            invoiceId: invoice.id,
          },
          {
            date: formattedDate,
            journalBookId: journalBook.id,
            ledgerId: creditLedgerId,
            type: EntryType.CREDIT,
            amount: grandTotal,
            preBalance: creditLedger.balance.toNumber(),
            narration: `Invoice ${newInvoiceNumber} - ${type}`,
            createdBy: userId,
            invoiceId: invoice.id,
          },
        ];

        await tx.journalEntry.createMany({ data: journalEntries });

        // 5. Update ledger balances

        await tx.ledger.update({
          where: { id: debitLedgerId },
          data: { balance: debitLedger.balance.toNumber() + grandTotal },
        });

        await tx.ledger.update({
          where: { id: creditLedgerId },
          data: { balance: creditLedger.balance.toNumber() + grandTotal },
        });

        // Update parent balances for debit and credit ledgers
        if (debitLedger.accountGroupId) {
          await updateParentBalances(tx, debitLedger.accountGroupId, branchId);
        }
        if (creditLedger.accountGroupId) {
          await updateParentBalances(tx, creditLedger.accountGroupId, branchId);
        }

        // 6. Update product stock and product ledger
        for (const item of invoice.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              ProductStock: {
                where: { godownId: item.godownId },
                take: 1,
              },
            },
          });

          if (!product) {
            throw new AppError(`Product not found: ${item.productId}`, 404);
          }

          if (!item.godownId) {
            throw new AppError(
              `Missing godownId for product: ${product.name}`,
              400
            );
          }

          const stock = product.ProductStock[0];
          const entryType =
            type === "PURCHASE" || type === "SALE_RETURN" ? "IN" : "OUT";

          const qtyDelta = entryType === "IN" ? item.quantity : -item.quantity;
          const thaanDelta =
            entryType === "IN" ? item.thaan || 0 : -(item.thaan || 0);

          // For OUT transactions, ensure stock is sufficient
          if (entryType === "OUT") {
            if (
              !stock ||
              stock.qty < item.quantity ||
              stock.thaan < (item.thaan || 0)
            ) {
              throw new AppError(
                `Insufficient stock for ${product.name} in selected godown`,
                400
              );
            }
          }

          // Update or create stock
          if (stock) {
            await tx.productStock.update({
              where: { id: stock.id },
              data: {
                qty: stock.qty + qtyDelta,
                thaan: stock.thaan + thaanDelta,
                updatedBy: userId,
              },
            });
          } else {
            // Only allow creating stock in IN transaction
            if (entryType === "IN") {
              await tx.productStock.create({
                data: {
                  productId: item.productId,
                  godownId: item.godownId,
                  unitId: product.unitId,
                  qty: qtyDelta,
                  thaan: thaanDelta,
                  createdBy: userId,
                },
              });
            } else {
              throw new AppError(
                `Stock not found for product: ${product.name}`,
                400
              );
            }
          }

          // Insert into Product Ledger
          const productBook = await tx.productBook.findFirst({
            where: {
              branchId,
              financialYearId: invoice.invoiceBook.financialYearId,
            },
          });

          if (!productBook) {
            throw new AppError("No product book found for this invoice", 400);
          }

          // Get total product stock before this transaction
          const totalBefore = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              qty: true,
              thaan: true,
            },
          });

          if (!totalBefore) {
            throw new AppError(
              `Product with ID ${item.productId} not found`,
              404
            );
          }

          const previousQty = totalBefore.qty;
          const previousThaan = totalBefore.thaan;

          const finalQty = previousQty + qtyDelta;
          const finalThaan = previousThaan + thaanDelta;

          await tx.productLedgerEntry.create({
            data: {
              productId: item.productId,
              productBookId: productBook.id,
              godownId: item.godownId,
              date: formattedDate,
              type: entryType,
              qty: item.quantity,
              thaan: item.thaan || 0,
              previousQty,
              previousThaan,
              finalQty,
              finalThaan,
              rate: item.rate,
              narration: `Invoice ${invoice.invoiceNumber} - ${type}`,
              createdBy: userId,
              invoiceId: invoice.id,
            },
          });
        }

        // Update the stock in the Product table
        for (const item of items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) {
            return next(
              new AppError(`Product with ID ${item.productId} not found`, 404)
            );
          }

          const updatedQty =
            type === "SALE" || type === "PURCHASE_RETURN"
              ? product.qty - item.quantity // Decrease stock for sales or purchase returns
              : product.qty + item.quantity; // Increase stock for purchases or sales returns

          await prisma.product.update({
            where: { id: item.productId },
            data: { qty: updatedQty },
          });
        }

        return invoice;
      }
    );

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
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
      cartage,
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
        cartage,
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
