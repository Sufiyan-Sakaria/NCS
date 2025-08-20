import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import { EntryType, InvoiceType, Prisma } from "../../generated/prisma";
import { updateParentBalances } from "../utils/UpdateParentBalances";
import {generateNextCode} from "../utils/GenerateNextCode";

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

// Create invoice with proper discount, tax, and cartage handling
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
        totalAmount, // Base amount before discount, tax, and cartage
        discount = 0,
        discountType = "AMOUNT", // 'AMOUNT' or 'PERCENTAGE'
        taxAmount = 0, // GST or other tax amount
        cartage = 0, // Cartage/freight amount
        grandTotal, // Final amount after discount, tax, and cartage
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
                            cartageAmount: cartage,
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
                            cartageAmount: cartage,
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
                            cartageAmount: cartage,
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
                            cartageAmount: cartage,
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
        cartageAmount: number;
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
        cartageAmount,
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
        let discountLedger = await tx.ledger.findFirst({
            where: {
                branchId,
                type: "SalesDiscount",
            },
        });

        // Create Sales Discount ledger if not found
        if (!discountLedger) {
            // Ensure "Indirect Expenses" group exists
            let expensesGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "IndirectExpenses" },
            });

            if (!expensesGroup) {
                // Get root "Expenses" group code
                const rootExpensesGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Expenses" },
                });

                if (!rootExpensesGroup) {
                    throw new AppError("Root Expenses group not found", 404);
                }

                // Generate code for Indirect Expenses under root
                const groupCode = await generateNextCode(tx, rootExpensesGroup.code, branchId);

                expensesGroup = await tx.accountGroup.create({
                    data: {
                        name: "Indirect Expenses",
                        code: groupCode,
                        nature: "Expenses",
                        groupType: "IndirectExpenses",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Sales Discount ledger
            const ledgerCode = await generateNextCode(tx, expensesGroup.code, branchId);

            discountLedger = await tx.ledger.create({
                data: {
                    name: "Sales Discount",
                    code: ledgerCode,
                    type: "SalesDiscount",
                    branchId,
                    createdBy: userId,
                    accountGroupId: expensesGroup.id,
                },
            });
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

    // 3. Cartage Paid A/c Dr (if cartage charged to customer)
    if (cartageAmount > 0) {
        let cartageLedger = await tx.ledger.findFirst({
            where: {
                branchId,
                type: "CartageOutward",
            },
        });

        // Create Cartage Outward ledger if not found
        if (!cartageLedger) {
            // Ensure "Indirect Incomes" group exists
            let incomeGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "IndirectIncomes" },
            });

            if (!incomeGroup) {
                // Get root "Income" group code
                const rootIncomeGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Income" },
                });

                if (!rootIncomeGroup) {
                    throw new AppError("Root Income group not found", 404);
                }

                // Generate code for Indirect Incomes under root
                const groupCode = await generateNextCode(tx, rootIncomeGroup.code, branchId);

                incomeGroup = await tx.accountGroup.create({
                    data: {
                        name: "Indirect Incomes",
                        code: groupCode,
                        nature: "Income",
                        groupType: "IndirectIncomes",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Cartage Outward ledger
            const ledgerCode = await generateNextCode(tx, incomeGroup.code, branchId);

            cartageLedger = await tx.ledger.create({
                data: {
                    name: "Cartage Outward",
                    code: ledgerCode,
                    type: "CartageOutward",
                    branchId,
                    createdBy: userId,
                    accountGroupId: incomeGroup.id,
                },
            });
        }

        journalEntries.push({
            date,
            journalBookId,
            ledgerId: customerLedgerId,
            type: EntryType.DEBIT,
            amount: cartageAmount,
            preBalance: customerLedger.balance.toNumber() + grandTotal,
            narration: `Cartage on Sale Invoice ${invoiceNumber}`,
            createdBy: userId,
            invoiceId,
        });

        journalEntries.push({
            date,
            journalBookId,
            ledgerId: cartageLedger.id,
            type: EntryType.CREDIT,
            amount: cartageAmount,
            preBalance: cartageLedger.balance.toNumber(),
            narration: `Cartage on Sale Invoice ${invoiceNumber}`,
            createdBy: userId,
            invoiceId,
        });

        // Update cartage ledger balance
        await tx.ledger.update({
            where: { id: cartageLedger.id },
            data: {
                balance: cartageLedger.balance.toNumber() + cartageAmount,
            },
        });

        if (cartageLedger.accountGroupId) {
            await updateParentBalances(tx, cartageLedger.accountGroupId, branchId);
        }
    }

    // 4. To Sales A/c Cr (Original amount before discount)
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

    // 5. To GST Output A/c Cr (if tax applicable)
    if (taxAmount > 0) {
        let taxLedger = await tx.ledger.findFirst({
            where: { branchId, type: "GSTOutput" },
        });

        // Ensure "Current Liabilities" group exists
        let GSTOutputAccountGroup = await tx.accountGroup.findFirst({
            where: { branchId, groupType: "CurrentLiabilities" },
        });

        if (!GSTOutputAccountGroup) {
            // Get root "Liabilities" group code
            const liabilitiesGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: null, nature: "Liabilities" },
            });

            if (!liabilitiesGroup) {
                throw new AppError("Root Liability group not found", 404);
            }

            // Generate code for Current Liabilities under Liabilities
            const groupCode = await generateNextCode(tx, liabilitiesGroup.code, branchId);

            GSTOutputAccountGroup = await tx.accountGroup.create({
                data: {
                    name: "Current Liabilities",
                    code: groupCode,
                    nature: "Liabilities",
                    groupType: "CurrentLiabilities",
                    branchId,
                    createdBy: userId,
                },
            });
        }

        // Create GST Output ledger if missing
        if (!taxLedger) {
            const ledgerCode = await generateNextCode(
                tx,
                GSTOutputAccountGroup.code,
                branchId
            );

            taxLedger = await tx.ledger.create({
                data: {
                    name: "GST Output",
                    code: ledgerCode,
                    type: "GSTOutput",
                    branchId,
                    createdBy: userId,
                    accountGroupId: GSTOutputAccountGroup.id,
                },
            });
        }

        // Push GST Output journal entry
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
        cartageAmount: number;
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
        cartageAmount,
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

    // 1. Purchase A/c Dr
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

    // 2. Cartage Inward A/c Dr (if cartage applicable)
    if (cartageAmount > 0) {
        let cartageLedger = await tx.ledger.findFirst({
            where: {
                branchId,
                type: "CartageInward",
            },
        });

        // Create Cartage Inward ledger if not found
        if (!cartageLedger) {
            // Ensure "Direct Expenses" group exists
            let expensesGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "DirectExpenses" },
            });

            if (!expensesGroup) {
                // Get root "Expenses" group code
                const rootExpensesGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Expenses" },
                });

                if (!rootExpensesGroup) {
                    throw new AppError("Root Expenses group not found", 404);
                }

                // Generate code for Direct Expenses under root
                const groupCode = await generateNextCode(tx, rootExpensesGroup.code, branchId);

                expensesGroup = await tx.accountGroup.create({
                    data: {
                        name: "Direct Expenses",
                        code: groupCode,
                        nature: "Expenses",
                        groupType: "DirectExpenses",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Cartage Inward ledger
            const ledgerCode = await generateNextCode(tx, expensesGroup.code, branchId);

            cartageLedger = await tx.ledger.create({
                data: {
                    name: "Cartage Inward",
                    code: ledgerCode,
                    type: "CartageInward",
                    branchId,
                    createdBy: userId,
                    accountGroupId: expensesGroup.id,
                },
            });
        }

        journalEntries.push({
            date,
            journalBookId,
            ledgerId: cartageLedger.id,
            type: EntryType.DEBIT,
            amount: cartageAmount,
            preBalance: cartageLedger.balance.toNumber(),
            narration: `Cartage on Purchase Invoice ${invoiceNumber}`,
            createdBy: userId,
            invoiceId,
        });

        // Update cartage ledger balance
        await tx.ledger.update({
            where: { id: cartageLedger.id },
            data: {
                balance: cartageLedger.balance.toNumber() + cartageAmount,
            },
        });

        if (cartageLedger.accountGroupId) {
            await updateParentBalances(tx, cartageLedger.accountGroupId, branchId);
        }
    }

    // 3. GST Input A/c Dr (if tax applicable)
    if (taxAmount > 0) {
        let taxLedger = await tx.ledger.findFirst({
            where: { branchId, type: "GSTInput" },
        });

        // Ensure "Current Assets" group exists
        let GSTInputAccountGroup = await tx.accountGroup.findFirst({
            where: { branchId, groupType: "CurrentAssets" },
        });

        if (!GSTInputAccountGroup) {
            // Get root "Assets" group code
            const assetsGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: null, nature: "Assets" },
            });

            if (!assetsGroup) {
                throw new AppError("Root Assets group not found", 404);
            }

            // Generate code for Current Assets under Assets
            const groupCode = await generateNextCode(tx, assetsGroup.code, branchId);

            GSTInputAccountGroup = await tx.accountGroup.create({
                data: {
                    name: "Current Assets",
                    code: groupCode,
                    nature: "Assets",
                    groupType: "CurrentAssets",
                    branchId,
                    createdBy: userId,
                },
            });
        }

        // Create GST Input ledger if missing
        if (!taxLedger) {
            const ledgerCode = await generateNextCode(
                tx,
                GSTInputAccountGroup.code,
                branchId
            );

            taxLedger = await tx.ledger.create({
                data: {
                    name: "GST Input",
                    code: ledgerCode,
                    type: "GSTInput",
                    branchId,
                    createdBy: userId,
                    accountGroupId: GSTInputAccountGroup.id,
                },
            });
        }

        // Push GST Input journal entry
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

    // 4. To Supplier A/c Cr
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

    // 5. Discount Received A/c Cr
    if (discountAmount > 0) {
        let discountLedger = await tx.ledger.findFirst({
            where: {
                branchId,
                type: "PurchaseDiscount",
            },
        });

        // Create Purchase Discount ledger if not found
        if (!discountLedger) {
            // Ensure "Indirect Incomes" group exists
            let incomeGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "IndirectIncomes" },
            });

            if (!incomeGroup) {
                // Get root "Income" group code
                const rootIncomeGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Income" },
                });

                if (!rootIncomeGroup) {
                    throw new AppError("Root Income group not found", 404);
                }

                // Generate code for Indirect Incomes under root
                const groupCode = await generateNextCode(tx, rootIncomeGroup.code, branchId);

                incomeGroup = await tx.accountGroup.create({
                    data: {
                        name: "Indirect Incomes",
                        code: groupCode,
                        nature: "Income",
                        groupType: "IndirectIncomes",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Purchase Discount ledger
            const ledgerCode = await generateNextCode(tx, incomeGroup.code, branchId);

            discountLedger = await tx.ledger.create({
                data: {
                    name: "Purchase Discount",
                    code: ledgerCode,
                    type: "PurchaseDiscount",
                    branchId,
                    createdBy: userId,
                    accountGroupId: incomeGroup.id,
                },
            });
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

// SALE RETURN journal entries
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
        cartageAmount: number;
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
        salesReturnLedgerId,
        totalAmount,
        cartageAmount,
        discountAmount,
        taxAmount,
        grandTotal,
    } = params;

    const customerLedger = await tx.ledger.findUnique({ where: { id: customerLedgerId } });
    const salesReturnLedger = await tx.ledger.findUnique({ where: { id: salesReturnLedgerId } });

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

    // 2. GST Output A/c Dr (reverse GST on sales)
    if (taxAmount > 0) {
        let taxLedger = await tx.ledger.findFirst({
            where: { branchId, type: "GSTOutput" },
        });

        // Ensure "Current Liabilities" group exists
        let GSTOutputAccountGroup = await tx.accountGroup.findFirst({
            where: { branchId, groupType: "CurrentLiabilities" },
        });

        if (!GSTOutputAccountGroup) {
            // Get root "Liabilities" group code
            const liabilitiesGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: null, nature: "Liabilities" },
            });

            if (!liabilitiesGroup) {
                throw new AppError("Root Liability group not found", 404);
            }

            // Generate code for Current Liabilities under Liabilities
            const groupCode = await generateNextCode(tx, liabilitiesGroup.code, branchId);

            GSTOutputAccountGroup = await tx.accountGroup.create({
                data: {
                    name: "Current Liabilities",
                    code: groupCode,
                    nature: "Liabilities",
                    groupType: "CurrentLiabilities",
                    branchId,
                    createdBy: userId,
                },
            });
        }

        // Create GST Output ledger if missing
        if (!taxLedger) {
            const ledgerCode = await generateNextCode(
                tx,
                GSTOutputAccountGroup.code,
                branchId
            );

            taxLedger = await tx.ledger.create({
                data: {
                    name: "GST Output",
                    code: ledgerCode,
                    type: "GSTOutput",
                    branchId,
                    createdBy: userId,
                    accountGroupId: GSTOutputAccountGroup.id,
                },
            });
        }

        // Push GST Output journal entry
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

        // Update tax ledger balance
        await tx.ledger.update({
            where: { id: taxLedger.id },
            data: {
                balance: taxLedger.balance.toNumber() - taxAmount,
            },
        });

        if (taxLedger.accountGroupId) {
            await updateParentBalances(tx, taxLedger.accountGroupId, branchId);
        }
    }

    // 3. Cartage Outward A/c Dr (reverse cartage on sales)
    if (cartageAmount > 0) {
        let cartageLedger = await tx.ledger.findFirst({
            where: {
                branchId,
                type: "CartageOutward",
            },
        });

        // Create Cartage Outward ledger if not found
        if (!cartageLedger) {
            // Ensure "Indirect Incomes" group exists
            let incomeGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "IndirectIncomes" },
            });

            if (!incomeGroup) {
                // Get root "Income" group code
                const rootIncomeGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Income" },
                });

                if (!rootIncomeGroup) {
                    throw new AppError("Root Income group not found", 404);
                }

                // Generate code for Indirect Incomes under root
                const groupCode = await generateNextCode(tx, rootIncomeGroup.code, branchId);

                incomeGroup = await tx.accountGroup.create({
                    data: {
                        name: "Indirect Incomes",
                        code: groupCode,
                        nature: "Income",
                        groupType: "IndirectIncomes",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Cartage Outward ledger
            const ledgerCode = await generateNextCode(tx, incomeGroup.code, branchId);

            cartageLedger = await tx.ledger.create({
                data: {
                    name: "Cartage Outward",
                    code: ledgerCode,
                    type: "CartageOutward",
                    branchId,
                    createdBy: userId,
                    accountGroupId: incomeGroup.id,
                },
            });
        }

        journalEntries.push({
            date,
            journalBookId,
            ledgerId: cartageLedger.id,
            type: EntryType.DEBIT,
            amount: cartageAmount,
            preBalance: cartageLedger.balance.toNumber(),
            narration: `Cartage on Sale Return Invoice ${invoiceNumber}`,
            createdBy: userId,
            invoiceId,
        });

        // Update cartage ledger balance
        await tx.ledger.update({
            where: { id: cartageLedger.id },
            data: {
                balance: cartageLedger.balance.toNumber() - cartageAmount,
            },
        });

        if (cartageLedger.accountGroupId) {
            await updateParentBalances(tx, cartageLedger.accountGroupId, branchId);
        }
    }

    // 4. Customer A/c Cr
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

    // 5. Discount handling
    if (discountAmount > 0) {
        let discountLedger = await tx.ledger.findFirst({
            where: { branchId, type: "SalesDiscount" },
        });

        // Create Sales Discount ledger if not found
        if (!discountLedger) {
            // Ensure "Indirect Expenses" group exists
            let expensesGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "IndirectExpenses" },
            });

            if (!expensesGroup) {
                // Get root "Expenses" group code
                const rootExpensesGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Expenses" },
                });

                if (!rootExpensesGroup) {
                    throw new AppError("Root Expenses group not found", 404);
                }

                // Generate code for Indirect Expenses under root
                const groupCode = await generateNextCode(tx, rootExpensesGroup.code, branchId);

                expensesGroup = await tx.accountGroup.create({
                    data: {
                        name: "Indirect Expenses",
                        code: groupCode,
                        nature: "Expenses",
                        groupType: "IndirectExpenses",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Sales Discount ledger
            const ledgerCode = await generateNextCode(tx, expensesGroup.code, branchId);

            discountLedger = await tx.ledger.create({
                data: {
                    name: "Sales Discount",
                    code: ledgerCode,
                    type: "SalesDiscount",
                    branchId,
                    createdBy: userId,
                    accountGroupId: expensesGroup.id,
                },
            });
        }

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
            data: { balance: discountLedger.balance.toNumber() - discountAmount },
        });

        if (discountLedger.accountGroupId) {
            await updateParentBalances(tx, discountLedger.accountGroupId, branchId);
        }
    }

    // Update balances
    await tx.ledger.update({
        where: { id: salesReturnLedgerId },
        data: { balance: salesReturnLedger.balance.toNumber() + totalAmount },
    });
    await tx.ledger.update({
        where: { id: customerLedgerId },
        data: { balance: customerLedger.balance.toNumber() - grandTotal },
    });

    // Update parent balances
    if (customerLedger.accountGroupId) {
        await updateParentBalances(tx, customerLedger.accountGroupId, branchId);
    }
    if (salesReturnLedger.accountGroupId) {
        await updateParentBalances(tx, salesReturnLedger.accountGroupId, branchId);
    }
}

// PURCHASE RETURN journal entries
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
        cartageAmount: number;
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
        purchaseReturnLedgerId,
        totalAmount,
        cartageAmount,
        discountAmount,
        taxAmount,
        grandTotal,
    } = params;

    const supplierLedger = await tx.ledger.findUnique({ where: { id: supplierLedgerId } });
    const purchaseReturnLedger = await tx.ledger.findUnique({ where: { id: purchaseReturnLedgerId } });

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

    // 2. Cartage Inward A/c Cr (reverse cartage on purchases)
    if (cartageAmount > 0) {
        let cartageLedger = await tx.ledger.findFirst({
            where: {
                branchId,
                type: "CartageInward",
            },
        });

        // Create Cartage Inward ledger if not found
        if (!cartageLedger) {
            // Ensure "Direct Expenses" group exists
            let expensesGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "DirectExpenses" },
            });

            if (!expensesGroup) {
                // Get root "Expenses" group code
                const rootExpensesGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Expenses" },
                });

                if (!rootExpensesGroup) {
                    throw new AppError("Root Expenses group not found", 404);
                }

                // Generate code for Direct Expenses under root
                const groupCode = await generateNextCode(tx, rootExpensesGroup.code, branchId);

                expensesGroup = await tx.accountGroup.create({
                    data: {
                        name: "Direct Expenses",
                        code: groupCode,
                        nature: "Expenses",
                        groupType: "DirectExpenses",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Cartage Inward ledger
            const ledgerCode = await generateNextCode(tx, expensesGroup.code, branchId);

            cartageLedger = await tx.ledger.create({
                data: {
                    name: "Cartage Inward",
                    code: ledgerCode,
                    type: "CartageInward",
                    branchId,
                    createdBy: userId,
                    accountGroupId: expensesGroup.id,
                },
            });
        }

        journalEntries.push({
            date,
            journalBookId,
            ledgerId: cartageLedger.id,
            type: EntryType.CREDIT,
            amount: cartageAmount,
            preBalance: cartageLedger.balance.toNumber(),
            narration: `Cartage on Purchase Return Invoice ${invoiceNumber}`,
            createdBy: userId,
            invoiceId,
        });

        // Update cartage ledger balance
        await tx.ledger.update({
            where: { id: cartageLedger.id },
            data: {
                balance: cartageLedger.balance.toNumber() - cartageAmount,
            },
        });

        if (cartageLedger.accountGroupId) {
            await updateParentBalances(tx, cartageLedger.accountGroupId, branchId);
        }
    }

    // 3. Discount handling
    if (discountAmount > 0) {
        let discountLedger = await tx.ledger.findFirst({
            where: { branchId, type: "PurchaseDiscount" },
        });

        // Create Purchase Discount ledger if not found
        if (!discountLedger) {
            // Ensure "Indirect Incomes" group exists
            let incomeGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: "IndirectIncomes" },
            });

            if (!incomeGroup) {
                // Get root "Income" group code
                const rootIncomeGroup = await tx.accountGroup.findFirst({
                    where: { branchId, groupType: null, nature: "Income" },
                });

                if (!rootIncomeGroup) {
                    throw new AppError("Root Income group not found", 404);
                }

                // Generate code for Indirect Incomes under root
                const groupCode = await generateNextCode(tx, rootIncomeGroup.code, branchId);

                incomeGroup = await tx.accountGroup.create({
                    data: {
                        name: "Indirect Incomes",
                        code: groupCode,
                        nature: "Income",
                        groupType: "IndirectIncomes",
                        branchId,
                        createdBy: userId,
                    },
                });
            }

            // Create Purchase Discount ledger
            const ledgerCode = await generateNextCode(tx, incomeGroup.code, branchId);

            discountLedger = await tx.ledger.create({
                data: {
                    name: "Purchase Discount",
                    code: ledgerCode,
                    type: "PurchaseDiscount",
                    branchId,
                    createdBy: userId,
                    accountGroupId: incomeGroup.id,
                },
            });
        }

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
            data: { balance: discountLedger.balance.toNumber() - discountAmount },
        });

        if (discountLedger.accountGroupId) {
            await updateParentBalances(tx, discountLedger.accountGroupId, branchId);
        }
    }

    // 4. Purchase Return A/c Cr
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

    // 5. GST Input A/c Cr (reverse GST on purchases)
    if (taxAmount > 0) {
        let taxLedger = await tx.ledger.findFirst({
            where: { branchId, type: "GSTInput" },
        });

        // Ensure "Current Assets" group exists
        let GSTInputAccountGroup = await tx.accountGroup.findFirst({
            where: { branchId, groupType: "CurrentAssets" },
        });

        if (!GSTInputAccountGroup) {
            // Get root "Assets" group code
            const assetsGroup = await tx.accountGroup.findFirst({
                where: { branchId, groupType: null, nature: "Assets" },
            });

            if (!assetsGroup) {
                throw new AppError("Root Assets group not found", 404);
            }

            // Generate code for Current Assets under Assets
            const groupCode = await generateNextCode(tx, assetsGroup.code, branchId);

            GSTInputAccountGroup = await tx.accountGroup.create({
                data: {
                    name: "Current Assets",
                    code: groupCode,
                    nature: "Assets",
                    groupType: "CurrentAssets",
                    branchId,
                    createdBy: userId,
                },
            });
        }

        // Create GST Input ledger if missing
        if (!taxLedger) {
            const ledgerCode = await generateNextCode(
                tx,
                GSTInputAccountGroup.code,
                branchId
            );

            taxLedger = await tx.ledger.create({
                data: {
                    name: "GST Input",
                    code: ledgerCode,
                    type: "GSTInput",
                    branchId,
                    createdBy: userId,
                    accountGroupId: GSTInputAccountGroup.id,
                },
            });
        }

        // Push GST Input journal entry
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

        // Update tax ledger balance
        await tx.ledger.update({
            where: { id: taxLedger.id },
            data: {
                balance: taxLedger.balance.toNumber() - taxAmount,
            },
        });

        if (taxLedger.accountGroupId) {
            await updateParentBalances(tx, taxLedger.accountGroupId, branchId);
        }
    }

    // Update balances
    await tx.ledger.update({
        where: { id: supplierLedgerId },
        data: { balance: supplierLedger.balance.toNumber() - grandTotal },
    });
    await tx.ledger.update({
        where: { id: purchaseReturnLedgerId },
        data: { balance: purchaseReturnLedger.balance.toNumber() + totalAmount },
    });

    // Update parent balances
    if (supplierLedger.accountGroupId) {
        await updateParentBalances(tx, supplierLedger.accountGroupId, branchId);
    }
    if (purchaseReturnLedger.accountGroupId) {
        await updateParentBalances(tx, purchaseReturnLedger.accountGroupId, branchId);
    }
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
        // Fetch product with stock in target godown
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
        const thaanDelta = entryType === "IN" ? item.thaan || 0 : -(item.thaan || 0);

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

        // Current global qty/thaan & old purchase rate before change
        const previousQty = product.qty;
        const previousThaan = product.thaan;
        const previousPurchaseRate = product.previousPurchaseRate || 0;

        const finalQty = previousQty + qtyDelta;
        const finalThaan = previousThaan + thaanDelta;

        // Weighted average purchase rate calculation
        let newPurchaseRate = previousPurchaseRate;
        if (entryType === "IN" && item.rate != null) {
            const totalOldValue = previousQty * previousPurchaseRate;
            const totalNewValue = item.quantity * item.rate;
            const totalQty = previousQty + item.quantity;

            newPurchaseRate =
                totalQty > 0 ? (totalOldValue + totalNewValue) / totalQty : item.rate;
        }

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

        // Update global product stock and purchase rate (only if IN)
        await tx.product.update({
            where: { id: item.productId },
            data: {
                qty: finalQty,
                thaan: finalThaan,
                ...(entryType === "IN" ? { previousPurchaseRate: newPurchaseRate } : {}),
            },
        });
    }
}

