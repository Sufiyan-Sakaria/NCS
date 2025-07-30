import { Request, Response, NextFunction } from "express";
import { EntryType, PrismaClient, VoucherType } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import { updateParentBalances } from "../utils/UpdateParentBalances";

const prisma = new PrismaClient();

export const createVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { date, type, reference, narration, totalAmount, entries } = req.body;
  const { branchId } = req.params;
  const { id: userId } = req.user!;

  try {
    // ✅ Step 1: Validate input
    if (!date || !type || !entries?.length) {
      return next(
        new AppError("Missing required fields: date, type, or entries", 400)
      );
    }

    if (!Object.values(VoucherType).includes(type)) {
      return next(new AppError("Invalid voucher type", 400));
    }

    // ✅ Step 2: Validate each entry
    for (const [i, entry] of entries.entries()) {
      if (!entry.ledgerId || !entry.voucherLedgerId || !entry.amount) {
        return next(new AppError(`Missing fields in entry #${i + 1}`, 400));
      }
      if (isNaN(entry.amount) || entry.amount <= 0) {
        return next(new AppError(`Invalid amount in entry #${i + 1}`, 400));
      }
    }

    // ✅ Step 3: Check if totalAmount matches sum of all entry amounts
    const calculatedTotal = entries.reduce(
      (sum: number, entry: any) => sum + Number(entry.amount),
      0
    );
    if (Number(totalAmount) !== calculatedTotal) {
      return next(
        new AppError(
          `Total (${totalAmount}) ≠ sum of entries (${calculatedTotal})`,
          400
        )
      );
    }

    // ✅ Step 4: Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      // ✅ Step 5: Get Voucher Book for type
      const voucherBook = await tx.voucherBook.findFirst({
        where: { branchId, type },
        orderBy: { createdAt: "desc" },
      });
      if (!voucherBook) throw new AppError("No voucher book found", 400);

      // ✅ Step 6: Generate new voucher number
      const lastVoucher = await tx.voucher.findFirst({
        where: { voucherBookId: voucherBook.id },
        orderBy: { createdAt: "desc" },
      });
      const newVoucherNumber = lastVoucher
        ? String(Number(lastVoucher.voucherNumber) + 1)
        : "1";

      const formattedDate = new Date(date).toISOString();

      // ✅ Step 7: Validate ledgers exist and get their account nature
      const enrichedEntries = [];
      for (const [i, entry] of entries.entries()) {
        const [ledger, voucherLedger] = await Promise.all([
          tx.ledger.findUnique({
            where: { id: entry.ledgerId },
            include: { accountGroup: true },
          }),
          tx.ledger.findUnique({
            where: { id: entry.voucherLedgerId },
            include: { accountGroup: true },
          }),
        ]);

        if (!ledger)
          throw new AppError(`Invalid ledgerId: ${entry.ledgerId}`, 400);
        if (!voucherLedger)
          throw new AppError(
            `Invalid voucherLedgerId: ${entry.voucherLedgerId}`,
            400
          );

        // ✅ Determine entry type based on voucher type and both account natures
        const entryType = determineEntryType(
          type,
          ledger.accountGroup.nature,
          voucherLedger.accountGroup.nature
        );

        enrichedEntries.push({
          ...entry,
          type: entryType,
          ledgerNature: ledger.accountGroup.nature,
          voucherLedgerNature: voucherLedger.accountGroup.nature,
        });
      }

      // ✅ Step 8: Create voucher (only store the main entries, not the double entries)
      const voucher = await tx.voucher.create({
        data: {
          voucherNumber: newVoucherNumber,
          date: formattedDate,
          type,
          voucherBookId: voucherBook.id,
          reference,
          narration,
          totalAmount,
          createdBy: userId,
          entries: {
            create: enrichedEntries.map((entry: any) => ({
              ledgerId: entry.ledgerId,
              voucherLedgerId: entry.voucherLedgerId,
              amount: entry.amount,
              type: entry.type,
              narration: entry.narration,
              createdBy: userId,
            })),
          },
        },
        include: {
          entries: true,
          voucherBook: true,
        },
      });

      // ✅ Step 9: Get journal book for current year
      const journalBook = await tx.journalBook.findFirst({
        where: {
          branchId,
          financialYearId: voucherBook.financialYearId,
        },
      });
      if (!journalBook)
        throw new AppError(
          "No journal book found for this financial year",
          400
        );

      // ✅ Step 10: Create journal entries (proper double-entry accounting)
      const journalEntries = [];

      for (const entry of voucher.entries) {
        // Debit entry
        if (entry.type === EntryType.DEBIT) {
          journalEntries.push({
            journalBookId: journalBook.id,
            date: formattedDate,
            narration: entry.narration ?? narration,
            ledgerId: entry.ledgerId,
            amount: entry.amount,
            type: EntryType.DEBIT,
            createdBy: userId,
          });
        } else {
          journalEntries.push({
            journalBookId: journalBook.id,
            date: formattedDate,
            narration: entry.narration ?? narration,
            ledgerId: entry.ledgerId,
            amount: entry.amount,
            type: EntryType.CREDIT,
            createdBy: userId,
          });
        }

        // Corresponding opposite entry for the voucher ledger
        const oppositeType =
          entry.type === EntryType.DEBIT ? EntryType.CREDIT : EntryType.DEBIT;
        journalEntries.push({
          journalBookId: journalBook.id,
          date: formattedDate,
          narration: entry.narration ?? narration,
          ledgerId: entry.voucherLedgerId,
          amount: entry.amount,
          type: oppositeType,
          createdBy: userId,
        });
      }

      await tx.journalEntry.createMany({ data: journalEntries });

      // ✅ Step 11: Update ledger balances (PROPER ACCOUNTING LOGIC)
      const affectedGroupIds = new Set<string>();

      for (const entry of voucher.entries) {
        const [mainLedger, voucherLedger] = await Promise.all([
          tx.ledger.findUnique({
            where: { id: entry.ledgerId },
            include: { accountGroup: true },
          }),
          tx.ledger.findUnique({
            where: { id: entry.voucherLedgerId },
            include: { accountGroup: true },
          }),
        ]);

        const amount = Number(entry.amount);

        // Update main ledger balance based on account nature and entry type
        const mainAccountNature = mainLedger?.accountGroup?.nature;
        const voucherAccountNature = voucherLedger?.accountGroup?.nature;

        // For main ledger
        if (entry.type === EntryType.DEBIT) {
          if (
            mainAccountNature === "Assets" ||
            mainAccountNature === "Expenses" ||
            mainAccountNature === "Drawings"
          ) {
            // DEBIT increases Assets, Expenses, Drawings
            await tx.ledger.update({
              where: { id: entry.ledgerId },
              data: { balance: { increment: amount } },
            });
          } else {
            // DEBIT decreases Liabilities, Capital, Income
            await tx.ledger.update({
              where: { id: entry.ledgerId },
              data: { balance: { decrement: amount } },
            });
          }
        } else {
          // CREDIT
          if (
            mainAccountNature === "Assets" ||
            mainAccountNature === "Expenses" ||
            mainAccountNature === "Drawings"
          ) {
            // CREDIT decreases Assets, Expenses, Drawings
            await tx.ledger.update({
              where: { id: entry.ledgerId },
              data: { balance: { decrement: amount } },
            });
          } else {
            // CREDIT increases Liabilities, Capital, Income
            await tx.ledger.update({
              where: { id: entry.ledgerId },
              data: { balance: { increment: amount } },
            });
          }
        }

        // For voucher ledger (opposite entry)
        const oppositeType =
          entry.type === EntryType.DEBIT ? EntryType.CREDIT : EntryType.DEBIT;

        if (oppositeType === EntryType.DEBIT) {
          if (
            voucherAccountNature === "Assets" ||
            voucherAccountNature === "Expenses" ||
            voucherAccountNature === "Drawings"
          ) {
            // DEBIT increases Assets, Expenses, Drawings
            await tx.ledger.update({
              where: { id: entry.voucherLedgerId },
              data: { balance: { increment: amount } },
            });
          } else {
            // DEBIT decreases Liabilities, Capital, Income
            await tx.ledger.update({
              where: { id: entry.voucherLedgerId },
              data: { balance: { decrement: amount } },
            });
          }
        } else {
          // CREDIT
          if (
            voucherAccountNature === "Assets" ||
            voucherAccountNature === "Expenses" ||
            voucherAccountNature === "Drawings"
          ) {
            // CREDIT decreases Assets, Expenses, Drawings
            await tx.ledger.update({
              where: { id: entry.voucherLedgerId },
              data: { balance: { decrement: amount } },
            });
          } else {
            // CREDIT increases Liabilities, Capital, Income
            await tx.ledger.update({
              where: { id: entry.voucherLedgerId },
              data: { balance: { increment: amount } },
            });
          }
        }

        // Get updated balances for logging
        const [updatedMainLedger, updatedVoucherLedger] = await Promise.all([
          tx.ledger.findUnique({
            where: { id: entry.ledgerId },
            select: { balance: true, name: true },
          }),
          tx.ledger.findUnique({
            where: { id: entry.voucherLedgerId },
            select: { balance: true, name: true },
          }),
        ]);

        if (mainLedger?.accountGroupId) {
          affectedGroupIds.add(mainLedger.accountGroupId);
        }
        if (voucherLedger?.accountGroupId) {
          affectedGroupIds.add(voucherLedger.accountGroupId);
        }
      }

      // ✅ Step 12: Recursively update account group balances
      for (const groupId of affectedGroupIds) {
        await updateParentBalances(tx, groupId, branchId);
      }

      return voucher;
    });

    // ✅ Step 13: Return success response
    res.status(201).json({ message: "Voucher created successfully", result });
  } catch (err) {
    next(err);
  }
};

function determineEntryType(
  voucherType: string,
  mainAccountNature: string,
  voucherAccountNature: string
): string {
  switch (voucherType) {
    case VoucherType.PAYMENT:
      // Payment means money is going out
      // The main ledger (what we're paying for) gets debited
      // The voucher ledger (cash/bank) gets credited

      if (
        mainAccountNature === "Expenses" ||
        mainAccountNature === "Drawings"
      ) {
        return EntryType.DEBIT; // Expenses/Drawings increase
      }

      if (mainAccountNature === "Liabilities") {
        return EntryType.DEBIT; // Liability decreases (paying off debt)
      }

      if (mainAccountNature === "Assets") {
        // If main is asset and voucher is also asset, main is what we're buying
        if (voucherAccountNature === "Assets") {
          return EntryType.DEBIT; // Asset being purchased increases
        }
        return EntryType.CREDIT; // Cash/Bank goes out
      }

      break;

    case VoucherType.RECEIPT:
      // Receipt means money is coming in
      // We need to identify which account is the cash/bank (receiving money)
      // and which is the source (what money is coming from)

      // The voucher ledger is typically the cash/bank account in receipts
      // The main ledger is what we're receiving money FROM

      if (voucherAccountNature === "Assets" && mainAccountNature === "Assets") {
        // Cash receiving from receivable
        // Main ledger (receivable) should be credited (decreases)
        return EntryType.CREDIT;
      }

      if (mainAccountNature === "Assets" && voucherAccountNature !== "Assets") {
        return EntryType.DEBIT; // Cash/Bank increases
      }

      if (
        mainAccountNature === "Income" ||
        mainAccountNature === "Liabilities" ||
        mainAccountNature === "Capital"
      ) {
        return EntryType.CREDIT; // Income/Liability/Capital increases
      }

      break;

    case VoucherType.CONTRA:
      // Money transfer between cash/bank accounts
      // One asset increases (debit), another decreases (credit)
      if (mainAccountNature === "Assets") {
        // Need to determine which account is receiving vs giving
        // Default: main ledger is the one receiving (debit)
        return EntryType.DEBIT;
      }
      break;

    case VoucherType.JOURNAL:
      // Standard accounting rules
      if (
        mainAccountNature === "Assets" ||
        mainAccountNature === "Expenses" ||
        mainAccountNature === "Drawings"
      ) {
        return EntryType.DEBIT;
      }

      if (
        mainAccountNature === "Liabilities" ||
        mainAccountNature === "Capital" ||
        mainAccountNature === "Income"
      ) {
        return EntryType.CREDIT;
      }
      break;

    case VoucherType.CREDIT_NOTE:
      // Credit note reduces income and receivables
      if (mainAccountNature === "Income") {
        return EntryType.DEBIT; // Reduce income
      }
      if (mainAccountNature === "Assets") {
        return EntryType.CREDIT; // Reduce receivables
      }
      break;

    case VoucherType.DEBIT_NOTE:
      // Debit note increases expenses and payables
      if (mainAccountNature === "Expenses" || mainAccountNature === "Assets") {
        return EntryType.DEBIT; // Increase expense/asset
      }
      if (mainAccountNature === "Liabilities") {
        return EntryType.CREDIT; // Increase payables
      }
      break;
  }

  // If we reach here, throw error
  throw new AppError(
    `Cannot determine entry type for voucher: ${voucherType}, main: ${mainAccountNature}, voucher: ${voucherAccountNature}`,
    400
  );
}

// Get Voucher No.
export const getVoucherNumber = async (
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

    if (!type || typeof type !== "string" || !(type in VoucherType)) {
      return next(new AppError("Invalid or missing voucher type", 400));
    }

    const voucherType = type as VoucherType;

    const voucherBook = await prisma.voucherBook.findFirst({
      where: { branchId, type: voucherType },
      orderBy: { createdAt: "desc" },
    });

    if (!voucherBook) {
      return next(new AppError("No voucher book found for this branch", 404));
    }

    const lastVoucher = await prisma.voucher.findFirst({
      where: { voucherBookId: voucherBook.id, type: voucherType },
      orderBy: { createdAt: "desc" },
    });

    const newVoucherNumber = lastVoucher
      ? parseInt(lastVoucher.voucherNumber) + 1
      : 1;

    res.status(200).json({ success: true, data: newVoucherNumber });
  } catch (error) {
    console.error(error);
    next(new AppError("Failed to fetch voucher number", 500));
  }
};

export const getVouchersByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { branchId } = req.params;
  if (!branchId || typeof branchId !== "string") {
    return next(new AppError("Branch ID is required", 400));
  }

  try {
    const vouchers = await prisma.voucher.findMany({
      where: {
        voucherBook: { branchId },
        isActive: true,
      },
      include: { entries: true },
      orderBy: { date: "desc" },
    });

    res.json({ vouchers });
  } catch (err) {
    next(err);
  }
};

export const updateVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { voucherNumber, narration, reference, totalAmount, updatedBy } =
    req.body;

  try {
    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        voucherNumber,
        narration,
        reference,
        totalAmount,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    res.json({ voucher });
  } catch (err) {
    next(err);
  }
};

export const deleteVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    await prisma.voucher.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
