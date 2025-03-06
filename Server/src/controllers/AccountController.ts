import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { AppError } from "../utils/AppError";
import { eq, desc, asc, isNull } from "drizzle-orm";
import { accountGroupTable, accountsTable, ledgersTable } from "../db/schema";
import { transactionTypeEnum } from "../db/schema";
import * as crypto from "crypto";

// Function to generate the next account group code
const getNextGroupCode = async (parentId: string | null) => {
  if (!parentId) {
    const lastTopLevelGroup = await db
      .select()
      .from(accountGroupTable)
      .where(isNull(accountGroupTable.parent_id))
      .orderBy(desc(accountGroupTable.code))
      .limit(1);

    return lastTopLevelGroup.length > 0
      ? `${parseInt(lastTopLevelGroup[0].code) + 1}`
      : "1";
  }

  const parentGroup = await db
    .select()
    .from(accountGroupTable)
    .where(eq(accountGroupTable.id, parentId))
    .limit(1);

  if (!parentGroup.length) throw new Error("Parent group not found");

  const lastChild = await db
    .select()
    .from(accountGroupTable)
    .where(eq(accountGroupTable.parent_id, parentId))
    .orderBy(desc(accountGroupTable.code))
    .limit(1);

  const nextNumber = lastChild.length
    ? parseInt(lastChild[0].code.split(".").pop()!) + 1
    : 1;

  return `${parentGroup[0].code}.${nextNumber}`;
};

// Create Account Group
export const CreateAccountGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, parentId, description, type } = req.body;

    if (!name || !type) {
      return next(new AppError("Name and type are required fields", 400));
    }

    const code = await getNextGroupCode(parentId);
    const id = crypto.randomUUID(); // Generate UUID for the id

    const newGroup = await db
      .insert(accountGroupTable)
      .values({
        id,
        name,
        parent_id: parentId,
        description,
        type,
        code,
      })
      .returning();

    res.status(201).json({
      status: "success",
      message: "Account group created successfully",
      data: newGroup[0],
    });
  } catch (error) {
    console.error("Error creating account group:", error);
    next(new AppError("Internal server error", 500));
  }
};

// Function to generate the next account code
const getNextAccountCode = async (groupId: string) => {
  const group = await db
    .select()
    .from(accountGroupTable)
    .where(eq(accountGroupTable.id, groupId))
    .limit(1);

  if (!group.length) throw new Error("Account group not found");

  const lastAccount = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.group_id, groupId))
    .orderBy(desc(accountsTable.code))
    .limit(1);

  const nextNumber = lastAccount.length
    ? parseInt(lastAccount[0].code.split(".").pop()!) + 1
    : 1;

  return `${group[0].code}.${nextNumber}`;
};

// Fetch all Accounts
export const GetAllAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allAccounts = await db
      .select()
      .from(accountsTable)
      .orderBy(asc(accountsTable.code));

    res.status(200).json({
      status: "success",
      message: "Accounts fetched successfully",
      accounts: allAccounts,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch Accounts By Type
export const GetAccountsByType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accountType } = req.query;

    if (!accountType || typeof accountType !== "string") {
      return next(
        new AppError(
          "Account type is required and must be a valid enum value",
          400
        )
      );
    }

    // Using the schema's enum type
    const filteredAccounts = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.account_type, accountType as any));

    res.status(200).json({
      status: "success",
      Accounts: filteredAccounts,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create Account
export const CreateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, groupId, accountType, openingBalance } = req.body;

    if (!name || !groupId || !accountType) {
      return next(new AppError("Missing required fields", 400));
    }

    // Check if an account with the same name already exists
    const existingAccount = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.name, name))
      .limit(1);

    if (existingAccount.length) {
      return next(
        new AppError("An account with this name already exists", 400)
      );
    }

    const code = await getNextAccountCode(groupId);
    const id = crypto.randomUUID(); // Generate UUID for the id

    const newAccount = await db
      .insert(accountsTable)
      .values({
        id,
        name,
        code,
        group_id: groupId,
        account_type: accountType,
        opening_balance: openingBalance,
        current_balance: openingBalance,
      })
      .returning();

    // Determine transaction type based on opening balance
    const numericBalance = parseFloat(openingBalance);
    let transactionType: (typeof transactionTypeEnum.enumValues)[number];

    if (numericBalance > 0) {
      transactionType = "Debit";
    } else if (numericBalance < 0) {
      transactionType = "Credit";
    } else {
      // For zero balance, default to Debit
      transactionType = "Debit";
    }

    const ledgerId = crypto.randomUUID(); // Generate UUID for the ledger entry

    // Create the ledger entry without a voucherId
    const ledgerEntry = await db
      .insert(ledgersTable)
      .values({
        id: ledgerId,
        date: new Date(),
        account_id: id,
        transaction_type: transactionType,
        amount: Math.abs(numericBalance).toString(), // Store absolute value as string
        description: "Opening Balance",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    res.status(201).json({
      status: "success",
      message: "Account created successfully",
      data: newAccount[0],
    });
  } catch (error) {
    console.error("Error creating account or ledger:", error);
    next(new AppError("Internal server error", 500));
  }
};

// Get Accounts Hierarchy
export const GetAccountsHierarchy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all account groups
    const accountGroupsData = await db
      .select()
      .from(accountGroupTable)
      .orderBy(asc(accountGroupTable.code));

    if (!accountGroupsData.length) {
      return next(new AppError("No Account Groups found", 404));
    }

    // Fetch all accounts separately
    const accountsData = await db.select().from(accountsTable);

    // Create a map with accounts by groupId for easier access
    const accountsByGroupId = accountsData.reduce((acc, account) => {
      if (!acc[account.group_id]) {
        acc[account.group_id] = [];
      }
      acc[account.group_id].push(account);
      return acc;
    }, {} as Record<string, typeof accountsData>);

    const buildHierarchy = (
      groups: any[],
      parentId: string | null = null
    ): any[] => {
      return groups
        .filter((group) => group.parent_id === parentId)
        .map((group) => ({
          id: group.id,
          name: group.name,
          code: group.code,
          groupId: group.parent_id,
          accountType: group.type,
          currentBalance: "0", // This would need to be calculated in a real app
          children: [
            ...buildHierarchy(groups, group.id),
            ...(accountsByGroupId[group.id] || []).map((account: any) => ({
              id: account.id,
              name: account.name,
              currentBalance: account.current_balance,
              code: account.code,
              accountType: account.account_type,
              children: [],
            })),
          ],
        }));
    };

    const hierarchicalData = buildHierarchy(accountGroupsData);

    res.status(200).json({
      status: "success",
      message: "Accounts Hierarchy fetched successfully",
      data: hierarchicalData,
    });
  } catch (error) {
    console.error("Error fetching account hierarchy:", error);
    next(new AppError("Internal server error", 500));
  }
};

// Update Account Group
export const UpdateAccountGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Transform keys to snake_case for database
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.parentId) dbUpdates.parent_id = updates.parentId;

    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date();

    const updatedGroup = await db
      .update(accountGroupTable)
      .set(dbUpdates)
      .where(eq(accountGroupTable.id, id))
      .returning();

    res.status(200).json({
      status: "success",
      message: "Account group updated successfully",
      data: updatedGroup[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update Account
export const UpdateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Transform keys to snake_case for database
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.groupId) dbUpdates.group_id = updates.groupId;
    if (updates.accountType) dbUpdates.account_type = updates.accountType;
    if (updates.openingBalance)
      dbUpdates.opening_balance = updates.openingBalance;
    if (updates.currentBalance)
      dbUpdates.current_balance = updates.currentBalance;
    if (updates.currency) dbUpdates.currency = updates.currency;

    // Always update the updated_at timestamp
    dbUpdates.updated_at = new Date();

    const updatedAccount = await db
      .update(accountsTable)
      .set(dbUpdates)
      .where(eq(accountsTable.id, id))
      .returning();

    res.status(200).json({
      status: "success",
      message: "Account updated successfully",
      data: updatedAccount[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete Account Group
export const DeleteAccountGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await db.delete(accountGroupTable).where(eq(accountGroupTable.id, id));

    res.status(200).json({
      status: "success",
      message: "Account group deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete Account
export const DeleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await db.delete(accountsTable).where(eq(accountsTable.id, id));

    res.status(200).json({
      status: "success",
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
