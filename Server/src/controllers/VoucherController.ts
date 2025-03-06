import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { eq, desc } from "drizzle-orm";
import { vouchersTable, ledgersTable, accountsTable } from "../db/schema";
import { AppError } from "../utils/AppError";
import { randomUUID } from "crypto";
import { DateTime } from "luxon";

// Type for grouped vouchers with ledgers
interface VoucherWithLedgers {
  [key: string]: {
    ledgers: any[];
    [key: string]: any;
  };
}

// Fetch all Vouchers
export const getAllVouchers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vouchers = await db
      .select()
      .from(vouchersTable)
      .leftJoin(ledgersTable, eq(vouchersTable.id, ledgersTable.voucher_id));

    // Group ledgers by voucher
    const vouchersWithLedgers: VoucherWithLedgers = {};

    vouchers.forEach((row) => {
      const voucherId = row.vouchers.id;
      if (!vouchersWithLedgers[voucherId]) {
        vouchersWithLedgers[voucherId] = {
          ...row.vouchers,
          ledgers: [],
        };
      }
      if (row.ledgers) {
        vouchersWithLedgers[voucherId].ledgers.push(row.ledgers);
      }
    });

    res.status(200).json({
      status: "success",
      message: "Vouchers fetched successfully",
      data: { vouchers: Object.values(vouchersWithLedgers) },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single Voucher by id
export const getSingleVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const voucherData = await db
      .select()
      .from(vouchersTable)
      .leftJoin(ledgersTable, eq(vouchersTable.id, ledgersTable.voucher_id))
      .where(eq(vouchersTable.id, id));

    if (!voucherData || voucherData.length === 0) {
      return next(new AppError("Voucher not found", 404));
    }

    // Construct voucher with ledgers
    const voucher = {
      ...voucherData[0].vouchers,
      ledgers: voucherData
        .filter((row) => row.ledgers)
        .map((row) => row.ledgers),
    };

    res.status(200).json({
      status: "success",
      message: "Voucher fetched successfully",
      data: { voucher },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create Voucher
export const createVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      voucherType,
      description,
      totalAmount,
      voucherAccId,
      ledgerEntries,
      date, // Accept date from user in dd-MM-yyyy format
    } = req.body;

    // Validate required fields
    if (
      !voucherType ||
      !ledgerEntries ||
      !Array.isArray(ledgerEntries) ||
      ledgerEntries.length === 0 ||
      !voucherAccId
    ) {
      return next(
        new AppError(
          "VoucherType, VoucherAccId, and LedgerEntries are required",
          400
        )
      );
    }

    // Fetch the last voucher number for the given type
    const lastVoucher = await db
      .select({
        voucherNo: vouchersTable.voucher_no,
      })
      .from(vouchersTable)
      .where(eq(vouchersTable.voucher_type, voucherType as any))
      .orderBy(desc(vouchersTable.voucher_no))
      .limit(1);

    const voucherNo = lastVoucher.length > 0 ? lastVoucher[0].voucherNo + 1 : 1;

    // Parse date from dd-MM-yyyy format or default to current date
    const voucherDate = DateTime.fromFormat(date, "dd-MM-yyyy", { zone: "UTC" })
      .setZone("Asia/Karachi")
      .toJSDate();

    // Generate a UUID for the voucher using Node's crypto module
    const voucherId = randomUUID();

    // Create the voucher
    await db.insert(vouchersTable).values({
      id: voucherId,
      voucher_type: voucherType as any,
      voucher_no: voucherNo,
      description,
      total_amount: totalAmount,
      date: voucherDate,
    });

    // Create ledger entries for the voucher
    for (const entry of ledgerEntries) {
      // Fetch the account to get current balance
      const account = await db
        .select({
          id: accountsTable.id,
          currentBalance: accountsTable.current_balance,
        })
        .from(accountsTable)
        .where(eq(accountsTable.id, entry.accountId)) // Changed from entry.account_id
        .limit(1);

      if (!account || account.length === 0) {
        throw new AppError(`Account with ID ${entry.accountId} not found`, 404);
      }

      const currentBalance = account[0].currentBalance;

      // Insert the ledger entry
      await db.insert(ledgersTable).values({
        id: randomUUID(),
        date: voucherDate,
        account_id: entry.accountId, // Changed from entry.account_id
        voucher_id: voucherId,
        transaction_type: entry.transactionType, // Changed from entry.transaction_type
        amount: entry.amount,
        description: entry.description,
        previous_balance: currentBalance,
      });

      // Update the account balance
      const updatedBalance =
        entry.transactionType === "Credit" // Changed from entry.transaction_type
          ? Number(currentBalance) - Number(entry.amount)
          : Number(currentBalance) + Number(entry.amount);

      await db
        .update(accountsTable)
        .set({
          current_balance: updatedBalance.toString(),
        })
        .where(eq(accountsTable.id, entry.accountId)); // Changed from entry.account_id
    }

    // Fetch the complete voucher with its ledger entries to return in the response
    const newVoucherData = await db
      .select()
      .from(vouchersTable)
      .leftJoin(ledgersTable, eq(vouchersTable.id, ledgersTable.voucher_id))
      .where(eq(vouchersTable.id, voucherId));

    const newVoucher = {
      ...newVoucherData[0].vouchers,
      ledgers: newVoucherData
        .filter((row) => row.ledgers)
        .map((row) => row.ledgers),
    };

    res.status(201).json({
      status: "success",
      message: "Voucher created successfully",
      data: { voucher: newVoucher },
    });
  } catch (error) {
    console.error("Error creating voucher:", error);
    next(new AppError("Internal server error", 500));
  }
};

// Update a Voucher (PATCH)
export const updateVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { voucherType, description, ledgerEntries, date } = req.body;

    // Check if voucher exists
    const existingVoucher = await db
      .select()
      .from(vouchersTable)
      .where(eq(vouchersTable.id, id))
      .limit(1);

    if (!existingVoucher || existingVoucher.length === 0) {
      return next(new AppError("Voucher not found", 404));
    }

    // Update voucher basic info
    if (voucherType || description !== undefined || date) {
      const updateData: Record<string, any> = {};

      if (voucherType) {
        updateData.voucher_type = voucherType as any;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (date) {
        // Parse date from dd-MM-yyyy format
        updateData.date = DateTime.fromFormat(date, "dd-MM-yyyy").toJSDate();
      }

      await db
        .update(vouchersTable)
        .set(updateData)
        .where(eq(vouchersTable.id, id));
    }

    // If ledger entries were provided, update them
    if (ledgerEntries && Array.isArray(ledgerEntries)) {
      // Delete existing ledger entries
      await db.delete(ledgersTable).where(eq(ledgersTable.voucher_id, id));

      // Parse date for ledger entries
      const entryDate = date
        ? DateTime.fromFormat(date, "dd-MM-yyyy").toJSDate()
        : new Date();

      // Insert new ledger entries
      for (const entry of ledgerEntries) {
        // Fetch the account to get current balance
        const account = await db
          .select({
            currentBalance: accountsTable.current_balance,
          })
          .from(accountsTable)
          .where(eq(accountsTable.id, entry.accountId))
          .limit(1);

        const currentBalance =
          account.length > 0 ? account[0].currentBalance : "0";

        await db.insert(ledgersTable).values({
          id: randomUUID(),
          date: entryDate,
          account_id: entry.accountId,
          voucher_id: id,
          transaction_type: entry.transactionType,
          amount: entry.amount,
          description: entry.description,
          previous_balance: currentBalance,
        });

        // Update the account balance
        const updatedBalance =
          entry.transactionType === "Credit"
            ? Number(currentBalance) - Number(entry.amount)
            : Number(currentBalance) + Number(entry.amount);

        await db
          .update(accountsTable)
          .set({
            current_balance: updatedBalance.toString(),
          })
          .where(eq(accountsTable.id, entry.accountId));
      }
    }

    // Fetch updated voucher
    const updatedVoucherData = await db
      .select()
      .from(vouchersTable)
      .leftJoin(ledgersTable, eq(vouchersTable.id, ledgersTable.voucher_id))
      .where(eq(vouchersTable.id, id));

    const updatedVoucher = {
      ...updatedVoucherData[0].vouchers,
      ledgers: updatedVoucherData
        .filter((row) => row.ledgers)
        .map((row) => row.ledgers),
    };

    res.status(200).json({
      status: "success",
      message: "Voucher updated successfully",
      data: { voucher: updatedVoucher },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete a Voucher
export const deleteVoucher = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if voucher exists
    const voucher = await db
      .select()
      .from(vouchersTable)
      .where(eq(vouchersTable.id, id))
      .limit(1);

    if (!voucher || voucher.length === 0) {
      return next(new AppError("Voucher not found", 404));
    }

    // Delete associated ledger entries first (to maintain foreign key constraints)
    await db.delete(ledgersTable).where(eq(ledgersTable.voucher_id, id));

    // Delete the voucher
    await db.delete(vouchersTable).where(eq(vouchersTable.id, id));

    res.status(200).json({
      status: "success",
      message: "Voucher deleted successfully",
    });
  } catch (error: any) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch next voucher number
export const getVoucherNo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { voucherType } = req.query;

    if (!voucherType || typeof voucherType !== "string") {
      return next(
        new AppError(
          "Voucher type is required and must be a valid enum value",
          400
        )
      );
    }

    // Fetch the last voucher with the given type
    const lastVoucher = await db
      .select({
        voucherNo: vouchersTable.voucher_no,
      })
      .from(vouchersTable)
      .where(eq(vouchersTable.voucher_type, voucherType as any))
      .orderBy(desc(vouchersTable.voucher_no))
      .limit(1);

    const voucherNo = lastVoucher.length > 0 ? lastVoucher[0].voucherNo + 1 : 1;

    res.status(200).json({
      status: "success",
      data: { voucherNo },
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
