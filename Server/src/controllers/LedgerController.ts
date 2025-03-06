import { NextFunction, Request, Response } from "express";
import { db } from "../db/index"; // Adjust based on your Drizzle setup
import { eq, and, gte, lte } from "drizzle-orm";
import { AppError } from "../utils/AppError";
import { ledgersTable, accountsTable, vouchersTable } from "../db/schema";
import { DateTime } from "luxon";
import { randomUUID } from "crypto";

// Fetch all Ledger entries
export const getAllLedgers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ledgerEntries = await db
      .select()
      .from(ledgersTable)
      .leftJoin(accountsTable, eq(ledgersTable.account_id, accountsTable.id))
      .leftJoin(vouchersTable, eq(ledgersTable.voucher_id, vouchersTable.id));
    res.status(200).json({
      status: "success",
      message: "Ledger entries fetched successfully",
      data: { ledgers: ledgerEntries },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single Ledger by accountId
export const getSingleLedger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountId } = req.params;
    const ledger = await db
      .select()
      .from(ledgersTable)
      .where(eq(ledgersTable.account_id, accountId));

    if (!ledger.length) {
      return next(new AppError("Ledger entry not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Ledger entry fetched successfully",
      data: { ledger },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single Ledger by id in date range
export const getAccountLedgerInDateRange = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountId } = req.params;
    const inputStartDate = req.query.startDate as string;
    const inputEndDate = req.query.endDate as string;

    if (!inputStartDate || !inputEndDate) {
      return next(new AppError("Start and end date are required", 400));
    }

    const startDate = DateTime.fromFormat(inputStartDate, "dd-MM-yyyy", {
      zone: "utc",
    })
      .startOf("day")
      .toJSDate();
    const endDate = DateTime.fromFormat(inputEndDate, "dd-MM-yyyy", {
      zone: "utc",
    })
      .endOf("day")
      .toJSDate();

    // Fetch ledger entries with account details
    const ledgerEntriesRaw = await db
      .select({
        ledgerId: ledgersTable.id,
        date: ledgersTable.date,
        transactionType: ledgersTable.transaction_type,
        amount: ledgersTable.amount,
        description: ledgersTable.description,
        previousBalance: ledgersTable.previous_balance,
        accountId: accountsTable.id,
        accountName: accountsTable.name,
        currentBalance: accountsTable.current_balance,
      })
      .from(ledgersTable)
      .where(
        and(
          eq(ledgersTable.account_id, accountId),
          gte(ledgersTable.date, startDate),
          lte(ledgersTable.date, endDate)
        )
      )
      .leftJoin(accountsTable, eq(ledgersTable.account_id, accountsTable.id))
      .orderBy(ledgersTable.date);

    // Format the data properly
    const ledgerEntries = ledgerEntriesRaw.map((entry) => ({
      id: entry.ledgerId,
      date: entry.date,
      transactionType: entry.transactionType,
      amount: entry.amount,
      description: entry.description,
      previousBalance: entry.previousBalance,
      account: {
        id: entry.accountId,
        name: entry.accountName,
        currentBalance: entry.currentBalance,
      },
    }));

    res.status(200).json({
      status: "success",
      message: "Ledger entries fetched successfully",
      data: { ledgers: ledgerEntries },
    });
  } catch (error) {
    console.error("Error fetching ledger:", error);
    next(new AppError("Internal server error", 500));
  }
};

// Create a new Ledger entry
export const createLedgerEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date, accountId, voucherId, transactionType, amount, description } =
      req.body;
    if (!accountId || !voucherId || !transactionType || !amount) {
      return next(new AppError("All fields are required", 400));
    }

    const account = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .limit(1);
    if (!account.length) return next(new AppError("Account not found", 404));

    const voucher = await db
      .select()
      .from(vouchersTable)
      .where(eq(vouchersTable.id, voucherId))
      .limit(1);
    if (!voucher.length) return next(new AppError("Voucher not found", 404));

    const previousBalance = Number(account[0].current_balance); // Convert to number
    const updatedBalance =
      transactionType === "Credit"
        ? previousBalance + Number(amount)
        : previousBalance - Number(amount);

    await db.insert(ledgersTable).values({
      id: randomUUID(),
      date,
      account_id: accountId,
      voucher_id: voucherId,
      transaction_type: transactionType,
      amount,
      description,
      previous_balance: previousBalance.toString(),
    });
    await db
      .update(accountsTable)
      .set({ current_balance: updatedBalance.toString() })
      .where(eq(accountsTable.id, accountId));

    res.status(201).json({
      status: "success",
      message: "Ledger entry created successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete a Ledger entry
export const deleteLedgerEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const ledger = await db
      .select()
      .from(ledgersTable)
      .where(eq(ledgersTable.id, id))
      .limit(1);
    if (!ledger.length)
      return next(new AppError("Ledger entry not found", 404));

    const account = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, ledger[0].account_id))
      .limit(1);
    if (account.length) {
      const updatedBalance =
        ledger[0].transaction_type === "Credit"
          ? Number(account[0].current_balance) - Number(ledger[0].amount)
          : Number(account[0].current_balance) + Number(ledger[0].amount);
      await db
        .update(accountsTable)
        .set({ current_balance: updatedBalance.toString() })
        .where(eq(accountsTable.id, ledger[0].account_id));
    }

    await db.delete(ledgersTable).where(eq(ledgersTable.id, id));
    res.status(200).json({
      status: "success",
      message: "Ledger entry deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
