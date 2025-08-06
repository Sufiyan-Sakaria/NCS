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

    if (!invoice || !invoice.ledgerId)
      return next(new AppError("Invoice not found", 404));

    // Fetch the single JournalEntry where ledgerId === invoice.ledgerId
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        invoiceId: id,
        ledgerId: invoice.ledgerId,
      },
    });

    // Attach it manually
    (invoice as any).JournalEntry = journalEntry;

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

// Create invoice with proper discount and tax handling
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
    totalAmount, // Base amount before discount and tax
    discount = 0,
    discountType = "AMOUNT", // 'AMOUNT' or 'PERCENTAGE'
    taxAmount = 0, // GST or other tax amount
    cartage = 0,
    grandTotal, // Final amount after discount and tax
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

        // Validate godowns
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

        // Calculate discount amount if percentage
        let discountAmount = discount;
        if (discountType === "PERCENTAGE") {
          discountAmount = (totalAmount * discount) / 100;
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
            discount: discountAmount,
            taxAmount,
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

        // 3. Get journal book
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

        // 4. Create journal entries based on invoice type
        const journalEntries: Prisma.JournalEntryCreateManyInput[] = [];

        switch (type) {
          case "SALE":
            await createSaleJournalEntries(tx, journalEntries, {
              date: formattedDate,
              journalBookId: journalBook.id,
              invoiceId: invoice.id,
              invoiceNumber: newInvoiceNumber.toString(),
              userId,
              branchId,
              customerLedgerId: ledgerId,
              salesLedgerId: invoiceLedgerId!,
              totalAmount,
              discountAmount,
              taxAmount,
              grandTotal,
            });
            break;

          case "PURCHASE":
            await createPurchaseJournalEntries(tx, journalEntries, {
              date: formattedDate,
              journalBookId: journalBook.id,
              invoiceId: invoice.id,
              invoiceNumber: newInvoiceNumber.toString(),
              userId,
              branchId,
              supplierLedgerId: ledgerId,
              purchaseLedgerId: invoiceLedgerId!,
              totalAmount,
              discountAmount,
              taxAmount,
              grandTotal,
            });
            break;

          case "SALE_RETURN":
            await createSaleReturnJournalEntries(tx, journalEntries, {
              date: formattedDate,
              journalBookId: journalBook.id,
              invoiceId: invoice.id,
              invoiceNumber: newInvoiceNumber.toString(),
              userId,
              branchId,
              customerLedgerId: ledgerId,
              salesReturnLedgerId: invoiceLedgerId!,
              totalAmount,
              discountAmount,
              taxAmount,
              grandTotal,
            });
            break;

          case "PURCHASE_RETURN":
            await createPurchaseReturnJournalEntries(tx, journalEntries, {
              date: formattedDate,
              journalBookId: journalBook.id,
              invoiceId: invoice.id,
              invoiceNumber: newInvoiceNumber.toString(),
              userId,
              branchId,
              supplierLedgerId: ledgerId,
              purchaseReturnLedgerId: invoiceLedgerId!,
              totalAmount,
              discountAmount,
              taxAmount,
              grandTotal,
            });
            break;

          default:
            throw new AppError("Unsupported invoice type", 400);
        }

        await tx.journalEntry.createMany({ data: journalEntries });

        // 5. Update product stock and product ledger
        await updateProductStockAndLedger(
          tx,
          invoice.items,
          type,
          invoice,
          branchId,
          userId,
          formattedDate
        );

        return invoice;
      }
    );

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    next(new AppError("Failed to create invoice", 500));
  }
};

// Helper function for SALE journal entries
async function createSaleJournalEntries(
  tx: Prisma.TransactionClient,
  journalEntries: any[],
  params: {
    date: string;
    journalBookId: string;
    invoiceId: string;
    invoiceNumber: string;
    userId: string;
    branchId: string;
    customerLedgerId: string;
    salesLedgerId: string;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  }
) {
  const {
    date,
    journalBookId,
    invoiceId,
    invoiceNumber,
    userId,
    branchId,
    customerLedgerId,
    salesLedgerId,
    totalAmount,
    discountAmount,
    taxAmount,
    grandTotal,
  } = params;

  // Get ledger balances
  const customerLedger = await tx.ledger.findUnique({
    where: { id: customerLedgerId },
  });
  const salesLedger = await tx.ledger.findUnique({
    where: { id: salesLedgerId },
  });

  if (!customerLedger || !salesLedger) {
    throw new AppError("Customer or Sales ledger not found", 404);
  }

  // 1. Customer A/c Dr (Grand Total - what customer will pay)
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: customerLedgerId,
    type: EntryType.DEBIT,
    amount: grandTotal,
    preBalance: customerLedger.balance.toNumber(),
    narration: `Sale Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // 2. Discount Allowed A/c Dr (if discount given)
  if (discountAmount > 0) {
    const discountLedger = await tx.ledger.findFirst({
      where: {
        branchId,
        type: "SalesDiscount",
      },
    });

    if (!discountLedger) {
      throw new AppError("Sales Discount ledger not found", 400);
    }

    journalEntries.push({
      date,
      journalBookId,
      ledgerId: discountLedger.id,
      type: EntryType.DEBIT,
      amount: discountAmount,
      preBalance: discountLedger.balance.toNumber(),
      narration: `Discount on Sale Invoice ${invoiceNumber}`,
      createdBy: userId,
      invoiceId,
    });

    // Update discount ledger balance
    await tx.ledger.update({
      where: { id: discountLedger.id },
      data: {
        balance: discountLedger.balance.toNumber() + discountAmount,
      },
    });

    if (discountLedger.accountGroupId) {
      await updateParentBalances(tx, discountLedger.accountGroupId, branchId);
    }
  }

  // 3. To Sales A/c Cr (Original amount before discount)
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: salesLedgerId,
    type: EntryType.CREDIT,
    amount: totalAmount,
    preBalance: salesLedger.balance.toNumber(),
    narration: `Sale Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // 4. To GST Output A/c Cr (if tax applicable)
  if (taxAmount > 0) {
    const taxLedger = await tx.ledger.findFirst({
      where: { branchId, type: "GSTOutput" },
    });

    if (!taxLedger) {
      throw new AppError("Tax ledger not found", 400);
    }

    journalEntries.push({
      date,
      journalBookId,
      ledgerId: taxLedger.id,
      type: EntryType.CREDIT,
      amount: taxAmount,
      preBalance: taxLedger.balance.toNumber(),
      narration: `GST on Sale Invoice ${invoiceNumber}`,
      createdBy: userId,
      invoiceId,
    });

    // Update tax ledger balance
    await tx.ledger.update({
      where: { id: taxLedger.id },
      data: {
        balance: taxLedger.balance.toNumber() + taxAmount,
      },
    });

    if (taxLedger.accountGroupId) {
      await updateParentBalances(tx, taxLedger.accountGroupId, branchId);
    }
  }

  // Update main ledger balances
  await tx.ledger.update({
    where: { id: customerLedgerId },
    data: { balance: customerLedger.balance.toNumber() + grandTotal },
  });

  await tx.ledger.update({
    where: { id: salesLedgerId },
    data: { balance: salesLedger.balance.toNumber() + totalAmount },
  });

  // Update parent balances
  if (customerLedger.accountGroupId) {
    await updateParentBalances(tx, customerLedger.accountGroupId, branchId);
  }
  if (salesLedger.accountGroupId) {
    await updateParentBalances(tx, salesLedger.accountGroupId, branchId);
  }
}

// Helper function for PURCHASE journal entries
async function createPurchaseJournalEntries(
  tx: Prisma.TransactionClient,
  journalEntries: any[],
  params: {
    date: string;
    journalBookId: string;
    invoiceId: string;
    invoiceNumber: string;
    userId: string;
    branchId: string;
    supplierLedgerId: string;
    purchaseLedgerId: string;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  }
) {
  const {
    date,
    journalBookId,
    invoiceId,
    invoiceNumber,
    userId,
    branchId,
    supplierLedgerId,
    purchaseLedgerId,
    totalAmount,
    discountAmount,
    taxAmount,
    grandTotal,
  } = params;

  // Get ledger balances
  const supplierLedger = await tx.ledger.findUnique({
    where: { id: supplierLedgerId },
  });
  const purchaseLedger = await tx.ledger.findUnique({
    where: { id: purchaseLedgerId },
  });

  if (!supplierLedger || !purchaseLedger) {
    throw new AppError("Supplier or Purchase ledger not found", 404);
  }

  // 1. Purchase A/c Dr (Original amount before discount)
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: purchaseLedgerId,
    type: EntryType.DEBIT,
    amount: totalAmount,
    preBalance: purchaseLedger.balance.toNumber(),
    narration: `Purchase Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // 2. GST Input A/c Dr (if tax applicable)
  if (taxAmount > 0) {
    const taxLedger = await tx.ledger.findFirst({
      where: { branchId, type: "GSTInput" },
    });

    if (!taxLedger) {
      throw new AppError("Tax ledger not found", 400);
    }

    journalEntries.push({
      date,
      journalBookId,
      ledgerId: taxLedger.id,
      type: EntryType.DEBIT,
      amount: taxAmount,
      preBalance: taxLedger.balance.toNumber(),
      narration: `GST on Purchase Invoice ${invoiceNumber}`,
      createdBy: userId,
      invoiceId,
    });

    // Update tax ledger balance
    await tx.ledger.update({
      where: { id: taxLedger.id },
      data: {
        balance: taxLedger.balance.toNumber() + taxAmount,
      },
    });

    if (taxLedger.accountGroupId) {
      await updateParentBalances(tx, taxLedger.accountGroupId, branchId);
    }
  }

  // 3. To Supplier A/c Cr (Grand Total - what we will pay)
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: supplierLedgerId,
    type: EntryType.CREDIT,
    amount: grandTotal,
    preBalance: supplierLedger.balance.toNumber(),
    narration: `Purchase Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // 4. To Discount Received A/c Cr (if discount received)
  if (discountAmount > 0) {
    const discountLedger = await tx.ledger.findFirst({
      where: {
        branchId,
        name: "PurchaseDiscount", // or "Discount Received"
      },
    });

    if (!discountLedger) {
      throw new AppError("Purchase Discount ledger not found", 400);
    }

    journalEntries.push({
      date,
      journalBookId,
      ledgerId: discountLedger.id,
      type: EntryType.CREDIT,
      amount: discountAmount,
      preBalance: discountLedger.balance.toNumber(),
      narration: `Discount on Purchase Invoice ${invoiceNumber}`,
      createdBy: userId,
      invoiceId,
    });

    // Update discount ledger balance
    await tx.ledger.update({
      where: { id: discountLedger.id },
      data: {
        balance: discountLedger.balance.toNumber() + discountAmount,
      },
    });

    if (discountLedger.accountGroupId) {
      await updateParentBalances(tx, discountLedger.accountGroupId, branchId);
    }
  }

  // Update main ledger balances
  await tx.ledger.update({
    where: { id: purchaseLedgerId },
    data: { balance: purchaseLedger.balance.toNumber() + totalAmount },
  });

  await tx.ledger.update({
    where: { id: supplierLedgerId },
    data: { balance: supplierLedger.balance.toNumber() + grandTotal },
  });

  // Update parent balances
  if (supplierLedger.accountGroupId) {
    await updateParentBalances(tx, supplierLedger.accountGroupId, branchId);
  }
  if (purchaseLedger.accountGroupId) {
    await updateParentBalances(tx, purchaseLedger.accountGroupId, branchId);
  }
}

// Helper function for SALE RETURN journal entries
async function createSaleReturnJournalEntries(
  tx: Prisma.TransactionClient,
  journalEntries: any[],
  params: {
    date: string;
    journalBookId: string;
    invoiceId: string;
    invoiceNumber: string;
    userId: string;
    branchId: string;
    customerLedgerId: string;
    salesReturnLedgerId: string;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  }
) {
  // Sale return entries are reverse of sale entries
  const {
    date,
    journalBookId,
    invoiceId,
    invoiceNumber,
    userId,
    branchId,
    customerLedgerId,
    salesReturnLedgerId,
    totalAmount,
    discountAmount,
    taxAmount,
    grandTotal,
  } = params;

  const customerLedger = await tx.ledger.findUnique({
    where: { id: customerLedgerId },
  });
  const salesReturnLedger = await tx.ledger.findUnique({
    where: { id: salesReturnLedgerId },
  });

  if (!customerLedger || !salesReturnLedger) {
    throw new AppError("Customer or Sales Return ledger not found", 404);
  }

  // 1. Sales Return A/c Dr
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: salesReturnLedgerId,
    type: EntryType.DEBIT,
    amount: totalAmount,
    preBalance: salesReturnLedger.balance.toNumber(),
    narration: `Sale Return Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // 2. GST Output A/c Dr (reverse the GST)
  if (taxAmount > 0) {
    const taxLedger = await tx.ledger.findFirst({
      where: { branchId, type: "GSTOutput" },
    });

    if (taxLedger) {
      journalEntries.push({
        date,
        journalBookId,
        ledgerId: taxLedger.id,
        type: EntryType.DEBIT,
        amount: taxAmount,
        preBalance: taxLedger.balance.toNumber(),
        narration: `GST on Sale Return Invoice ${invoiceNumber}`,
        createdBy: userId,
        invoiceId,
      });

      await tx.ledger.update({
        where: { id: taxLedger.id },
        data: {
          balance: taxLedger.balance.toNumber() - taxAmount,
        },
      });
    }
  }

  // 3. To Customer A/c Cr
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: customerLedgerId,
    type: EntryType.CREDIT,
    amount: grandTotal,
    preBalance: customerLedger.balance.toNumber(),
    narration: `Sale Return Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // Handle discount if any
  if (discountAmount > 0) {
    const discountLedger = await tx.ledger.findFirst({
      where: {
        branchId,
        name: "SalesDiscount",
      },
    });

    if (discountLedger) {
      journalEntries.push({
        date,
        journalBookId,
        ledgerId: discountLedger.id,
        type: EntryType.CREDIT,
        amount: discountAmount,
        preBalance: discountLedger.balance.toNumber(),
        narration: `Discount on Sale Return Invoice ${invoiceNumber}`,
        createdBy: userId,
        invoiceId,
      });

      await tx.ledger.update({
        where: { id: discountLedger.id },
        data: {
          balance: discountLedger.balance.toNumber() - discountAmount,
        },
      });
    }
  }

  // Update main ledger balances
  await tx.ledger.update({
    where: { id: salesReturnLedgerId },
    data: { balance: salesReturnLedger.balance.toNumber() + totalAmount },
  });

  await tx.ledger.update({
    where: { id: customerLedgerId },
    data: { balance: customerLedger.balance.toNumber() - grandTotal },
  });
}

// Helper function for PURCHASE RETURN journal entries
async function createPurchaseReturnJournalEntries(
  tx: Prisma.TransactionClient,
  journalEntries: any[],
  params: {
    date: string;
    journalBookId: string;
    invoiceId: string;
    invoiceNumber: string;
    userId: string;
    branchId: string;
    supplierLedgerId: string;
    purchaseReturnLedgerId: string;
    totalAmount: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
  }
) {
  // Purchase return entries are reverse of purchase entries
  const {
    date,
    journalBookId,
    invoiceId,
    invoiceNumber,
    userId,
    branchId,
    supplierLedgerId,
    purchaseReturnLedgerId,
    totalAmount,
    discountAmount,
    taxAmount,
    grandTotal,
  } = params;

  const supplierLedger = await tx.ledger.findUnique({
    where: { id: supplierLedgerId },
  });
  const purchaseReturnLedger = await tx.ledger.findUnique({
    where: { id: purchaseReturnLedgerId },
  });

  if (!supplierLedger || !purchaseReturnLedger) {
    throw new AppError("Supplier or Purchase Return ledger not found", 404);
  }

  // 1. Supplier A/c Dr
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: supplierLedgerId,
    type: EntryType.DEBIT,
    amount: grandTotal,
    preBalance: supplierLedger.balance.toNumber(),
    narration: `Purchase Return Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // Handle discount if any
  if (discountAmount > 0) {
    const discountLedger = await tx.ledger.findFirst({
      where: {
        branchId,
        name: "PurchaseDiscount",
      },
    });

    if (discountLedger) {
      journalEntries.push({
        date,
        journalBookId,
        ledgerId: discountLedger.id,
        type: EntryType.DEBIT,
        amount: discountAmount,
        preBalance: discountLedger.balance.toNumber(),
        narration: `Discount on Purchase Return Invoice ${invoiceNumber}`,
        createdBy: userId,
        invoiceId,
      });

      await tx.ledger.update({
        where: { id: discountLedger.id },
        data: {
          balance: discountLedger.balance.toNumber() - discountAmount,
        },
      });
    }
  }

  // 2. To Purchase Return A/c Cr
  journalEntries.push({
    date,
    journalBookId,
    ledgerId: purchaseReturnLedgerId,
    type: EntryType.CREDIT,
    amount: totalAmount,
    preBalance: purchaseReturnLedger.balance.toNumber(),
    narration: `Purchase Return Invoice ${invoiceNumber}`,
    createdBy: userId,
    invoiceId,
  });

  // 3. To GST Input A/c Cr (reverse the GST)
  if (taxAmount > 0) {
    const taxLedger = await tx.ledger.findFirst({
      where: { branchId, type: "GSTInput" },
    });

    if (taxLedger) {
      journalEntries.push({
        date,
        journalBookId,
        ledgerId: taxLedger.id,
        type: EntryType.CREDIT,
        amount: taxAmount,
        preBalance: taxLedger.balance.toNumber(),
        narration: `GST on Purchase Return Invoice ${invoiceNumber}`,
        createdBy: userId,
        invoiceId,
      });

      await tx.ledger.update({
        where: { id: taxLedger.id },
        data: {
          balance: taxLedger.balance.toNumber() - taxAmount,
        },
      });
    }
  }

  // Update main ledger balances
  await tx.ledger.update({
    where: { id: supplierLedgerId },
    data: { balance: supplierLedger.balance.toNumber() - grandTotal },
  });

  await tx.ledger.update({
    where: { id: purchaseReturnLedgerId },
    data: { balance: purchaseReturnLedger.balance.toNumber() + totalAmount },
  });
}

// Helper function to update product stock and ledger (simplified version)
async function updateProductStockAndLedger(
  tx: Prisma.TransactionClient,
  items: any[],
  type: string,
  invoice: any,
  branchId: string,
  userId: string,
  formattedDate: string
) {
  for (const item of items) {
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

    const stock = product.ProductStock[0];
    const entryType =
      type === "PURCHASE" || type === "SALE_RETURN" ? "IN" : "OUT";

    const qtyDelta = entryType === "IN" ? item.quantity : -item.quantity;
    const thaanDelta =
      entryType === "IN" ? item.thaan || 0 : -(item.thaan || 0);

    // Check for sufficient stock in case of OUT
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

    // Update or create godown stock
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
        throw new AppError(`Stock not found for product: ${product.name}`, 400);
      }
    }

    // Get Product Book
    const productBook = await tx.productBook.findFirst({
      where: {
        branchId,
        financialYearId: invoice.invoiceBook.financialYearId,
      },
    });

    if (!productBook) {
      throw new AppError("No product book found for this invoice", 400);
    }

    // Fetch current global qty/thaan before change
    const current = await tx.product.findUnique({
      where: { id: item.productId },
      select: { qty: true, thaan: true },
    });

    if (!current) {
      throw new AppError(`Product with ID ${item.productId} not found`, 404);
    }

    const previousQty = current.qty;
    const previousThaan = current.thaan;

    const finalQty = previousQty + qtyDelta;
    const finalThaan = previousThaan + thaanDelta;

    // Insert Product Ledger Entry
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

    // Update global product stock
    await tx.product.update({
      where: { id: item.productId },
      data: {
        qty: finalQty,
        thaan: finalThaan,
      },
    });
  }
}
