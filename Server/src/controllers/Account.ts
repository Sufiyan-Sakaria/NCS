import { PrismaClient } from "../../generated/prisma";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
  };
}

// GET all account groups by branch
export const getAccountGroupsByBranch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const accountGroups = await prisma.accountGroup.findMany({
      where: { branchId, isActive: true },
      include: {
        parent: true,
        children: true,
        Ledger: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({ success: true, data: accountGroups });
  } catch (error) {
    next(error);
  }
};

// GET single account group by ID
export const getAccountGroupById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const accountGroup = await prisma.accountGroup.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        Ledger: {
          where: { isActive: true },
        },
      },
    });

    if (!accountGroup) {
      return next(new AppError("Account group not found", 404));
    }

    res.status(200).json({ success: true, data: accountGroup });
  } catch (error) {
    next(error);
  }
};

// CREATE new account group
export const createAccountGroup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, code, balance, nature, parentId, branchId } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!name || !code || !nature || !branchId) {
      return next(new AppError("Missing required fields", 400));
    }

    const accountGroup = await prisma.accountGroup.create({
      data: {
        name,
        code,
        balance: balance || 0,
        nature,
        parentId,
        branchId,
        createdBy: userId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    res.status(201).json({ success: true, data: accountGroup });
  } catch (error) {
    next(error);
  }
};

// UPDATE account group
export const updateAccountGroup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, code, balance, nature, parentId } = req.body;
    const userId = req.user?.id;

    const accountGroup = await prisma.accountGroup.update({
      where: { id },
      data: {
        name,
        code,
        balance,
        nature,
        parentId,
        updatedBy: userId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    res.status(200).json({ success: true, data: accountGroup });
  } catch (error) {
    next(error);
  }
};

// DELETE account group (soft delete)
export const deleteAccountGroup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if account group has children
    const hasChildren = await prisma.accountGroup.findFirst({
      where: { parentId: id, isActive: true },
    });

    if (hasChildren) {
      return next(
        new AppError("Cannot delete account group with child accounts", 400)
      );
    }

    // Check if account group has ledgers
    const hasLedgers = await prisma.ledger.findFirst({
      where: { accountGroupId: id, isActive: true },
    });

    if (hasLedgers) {
      return next(
        new AppError("Cannot delete account group with associated ledgers", 400)
      );
    }

    await prisma.accountGroup.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Account group deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET all ledgers by branch
export const getLedgersByBranch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const ledgers = await prisma.ledger.findMany({
      where: { branchId, isActive: true },
      include: {
        accountGroup: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({ success: true, data: ledgers });
  } catch (error) {
    next(error);
  }
};

// GET single ledger by ID
export const getLedgerById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const ledger = await prisma.ledger.findUnique({
      where: { id },
      include: {
        accountGroup: true,
        JournalEntry: {
          include: {
            journal: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ledger) {
      return next(new AppError("Ledger not found", 404));
    }

    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    next(error);
  }
};

// CREATE new ledger with opening balance journal entry
export const createLedger = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      code,
      type,
      phone1,
      phone2,
      openingBalance,
      accountGroupId,
      branchId,
      financialYearId,
    } = req.body;
    const userId = req.user?.id;

    // Validate required fields
    if (!name || !code || !type || !accountGroupId || !branchId) {
      return next(new AppError("Missing required fields", 400));
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ledger
      const ledger = await tx.ledger.create({
        data: {
          name,
          code,
          type,
          phone1: phone1 || "",
          phone2: phone2 || "",
          balance: openingBalance || 0,
          openingBalance: openingBalance || 0,
          accountGroupId,
          branchId,
          createdBy: userId,
        },
        include: {
          accountGroup: true,
        },
      });

      // Create opening balance journal entry if opening balance is not zero
      if (openingBalance && openingBalance !== 0) {
        // Get account group nature to determine debit/credit
        const accountGroup = await tx.accountGroup.findUnique({
          where: { id: accountGroupId },
        });

        if (!accountGroup) {
          throw new AppError("Account group not found", 404);
        }

        // Find or create Capital account for contra entry
        let capitalAccount = await tx.ledger.findFirst({
          where: {
            branchId,
            type: "OwnerCapital",
            isActive: true,
          },
        });

        if (!capitalAccount) {
          // Find Capital account group
          let capitalGroup = await tx.accountGroup.findFirst({
            where: {
              branchId,
              nature: "Capital",
              isActive: true,
            },
          });

          if (!capitalGroup) {
            // Create Capital account group if it doesn't exist
            capitalGroup = await tx.accountGroup.create({
              data: {
                name: "Capital",
                code: "3",
                balance: 0,
                nature: "Capital",
                branchId,
                createdBy: userId,
              },
            });
          }

          // Create Capital ledger
          capitalAccount = await tx.ledger.create({
            data: {
              name: "Owner's Capital",
              code: "CAP001",
              type: "OwnerCapital",
              phone1: "",
              phone2: "",
              balance: 0,
              openingBalance: 0,
              accountGroupId: capitalGroup.id,
              branchId,
              createdBy: userId,
            },
          });
        }

        // Create journal for opening balance
        const journal = await tx.journal.create({
          data: {
            label: `Opening Balance - ${ledger.name}`,
            date: new Date(),
            financialYearId,
            branchId,
            narration: `Opening balance entry for ${ledger.name}`,
            createdBy: userId,
          },
        });

        // Determine debit/credit based on account nature and opening balance
        const isDebitBalance = openingBalance > 0;
        const isAssetOrExpense = ["Assets", "Expenses"].includes(
          accountGroup.nature
        );

        let ledgerEntryType: "DEBIT" | "CREDIT";
        let capitalEntryType: "DEBIT" | "CREDIT";

        if (isAssetOrExpense) {
          // Assets and Expenses increase with debit
          ledgerEntryType = isDebitBalance ? "DEBIT" : "CREDIT";
          capitalEntryType = isDebitBalance ? "CREDIT" : "DEBIT";
        } else {
          // Liabilities, Capital, and Income increase with credit
          ledgerEntryType = isDebitBalance ? "CREDIT" : "DEBIT";
          capitalEntryType = isDebitBalance ? "DEBIT" : "CREDIT";
        }

        // Create journal entries
        await tx.journalEntry.createMany({
          data: [
            {
              journalId: journal.id,
              ledgerId: ledger.id,
              type: ledgerEntryType,
              amount: Math.abs(openingBalance),
              narration: `Opening balance`,
              createdBy: userId,
            },
            {
              journalId: journal.id,
              ledgerId: capitalAccount.id,
              type: capitalEntryType,
              amount: Math.abs(openingBalance),
              narration: `Contra entry for ${ledger.name} opening balance`,
              createdBy: userId,
            },
          ],
        });

        // Update capital account balance
        await tx.ledger.update({
          where: { id: capitalAccount.id },
          data: {
            balance: {
              increment:
                capitalEntryType === "CREDIT"
                  ? Math.abs(openingBalance)
                  : -Math.abs(openingBalance),
            },
          },
        });
      }

      return ledger;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// UPDATE ledger
export const updateLedger = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, code, type, phone1, phone2, accountGroupId } = req.body;
    const userId = req.user?.id;

    const ledger = await prisma.ledger.update({
      where: { id },
      data: {
        name,
        code,
        type,
        phone1,
        phone2,
        accountGroupId,
        updatedBy: userId,
      },
      include: {
        accountGroup: true,
      },
    });

    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    next(error);
  }
};

// DELETE ledger (soft delete)
export const deleteLedger = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if ledger has journal entries
    const hasEntries = await prisma.journalEntry.findFirst({
      where: { ledgerId: id, isActive: true },
    });

    if (hasEntries) {
      return next(
        new AppError("Cannot delete ledger with journal entries", 400)
      );
    }

    await prisma.ledger.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Ledger deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// CREATE default account structure
export const createDefaultAccounts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.body;
    const userId = req.user?.id;

    if (!branchId) {
      return next(new AppError("Branch ID is required", 400));
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create main account groups with hierarchical codes
      const accountGroups = [
        { name: "Assets", nature: "Assets" as const, code: "1" },
        { name: "Liabilities", nature: "Liabilities" as const, code: "2" },
        { name: "Capital", nature: "Capital" as const, code: "3" },
        { name: "Income", nature: "Income" as const, code: "4" },
        { name: "Expenses", nature: "Expenses" as const, code: "5" },
      ];

      const createdGroups: any[] = [];
      for (const group of accountGroups) {
        const createdGroup = await tx.accountGroup.create({
          data: {
            name: group.name,
            code: group.code,
            balance: 0,
            nature: group.nature,
            branchId,
            createdBy: userId,
          },
        });
        createdGroups.push(createdGroup);
      }

      // Create sub-groups with hierarchical codes
      const assetsGroup = createdGroups.find((g) => g.name === "Assets");
      const liabilitiesGroup = createdGroups.find(
        (g) => g.name === "Liabilities"
      );
      const expensesGroup = createdGroups.find((g) => g.name === "Expenses");
      const incomeGroup = createdGroups.find((g) => g.name === "Income");

      const subGroups = [
        // Assets sub-groups
        {
          name: "Fixed Assets",
          nature: "Assets" as const,
          parentId: assetsGroup.id,
          code: `${assetsGroup.code}.1`,
        },
        {
          name: "Current Assets",
          nature: "Assets" as const,
          parentId: assetsGroup.id,
          code: `${assetsGroup.code}.2`,
        },
        {
          name: "Investments",
          nature: "Assets" as const,
          parentId: assetsGroup.id,
          code: `${assetsGroup.code}.3`,
        },

        // Liabilities sub-groups
        {
          name: "Current Liabilities",
          nature: "Liabilities" as const,
          parentId: liabilitiesGroup.id,
          code: `${liabilitiesGroup.code}.1`,
        },
        {
          name: "Long Term Liabilities",
          nature: "Liabilities" as const,
          parentId: liabilitiesGroup.id,
          code: `${liabilitiesGroup.code}.2`,
        },

        // Expenses sub-groups
        {
          name: "Direct Expenses",
          nature: "Expenses" as const,
          parentId: expensesGroup.id,
          code: `${expensesGroup.code}.1`,
        },
        {
          name: "Indirect Expenses",
          nature: "Expenses" as const,
          parentId: expensesGroup.id,
          code: `${expensesGroup.code}.2`,
        },

        // Income sub-groups
        {
          name: "Direct Income",
          nature: "Income" as const,
          parentId: incomeGroup.id,
          code: `${incomeGroup.code}.1`,
        },
        {
          name: "Indirect Income",
          nature: "Income" as const,
          parentId: incomeGroup.id,
          code: `${incomeGroup.code}.2`,
        },
      ];

      const createdSubGroups: any[] = [];
      for (const subGroup of subGroups) {
        const createdSubGroup = await tx.accountGroup.create({
          data: {
            name: subGroup.name,
            code: subGroup.code,
            balance: 0,
            nature: subGroup.nature,
            parentId: subGroup.parentId,
            branchId,
            createdBy: userId,
          },
        });
        createdSubGroups.push(createdSubGroup);
      }

      // Create default ledgers with hierarchical codes
      const currentAssetsGroup = createdSubGroups.find(
        (g) => g.name === "Current Assets"
      );
      const fixedAssetsGroup = createdSubGroups.find(
        (g) => g.name === "Fixed Assets"
      );
      const currentLiabilitiesGroup = createdSubGroups.find(
        (g) => g.name === "Current Liabilities"
      );
      const capitalGroup = createdGroups.find((g) => g.name === "Capital");
      const directExpensesGroup = createdSubGroups.find(
        (g) => g.name === "Direct Expenses"
      );
      const indirectExpensesGroup = createdSubGroups.find(
        (g) => g.name === "Indirect Expenses"
      );
      const directIncomeGroup = createdSubGroups.find(
        (g) => g.name === "Direct Income"
      );

      // Helper function to generate ledger codes
      const getNextLedgerCode = (groupCode: string, index: number) => {
        return `${groupCode}.${index}`;
      };

      const defaultLedgers = [
        // Current Assets (1.2)
        {
          name: "Cash In Hand",
          type: "Cash",
          accountGroupId: currentAssetsGroup.id,
          code: getNextLedgerCode(currentAssetsGroup.code, 1), // 1.2.1
        },
        {
          name: "Bank Account",
          type: "Bank",
          accountGroupId: currentAssetsGroup.id,
          code: getNextLedgerCode(currentAssetsGroup.code, 2), // 1.2.2
        },
        {
          name: "Accounts Receivable",
          type: "AccountsReceivable",
          accountGroupId: currentAssetsGroup.id,
          code: getNextLedgerCode(currentAssetsGroup.code, 3), // 1.2.3
        },
        {
          name: "Inventory",
          type: "Inventory",
          accountGroupId: currentAssetsGroup.id,
          code: getNextLedgerCode(currentAssetsGroup.code, 4), // 1.2.4
        },
        {
          name: "Prepaid Expenses",
          type: "PrepaidExpenses",
          accountGroupId: currentAssetsGroup.id,
          code: getNextLedgerCode(currentAssetsGroup.code, 5), // 1.2.5
        },

        // Fixed Assets (1.1)
        {
          name: "Plant & Machinery",
          type: "FixedAssets",
          accountGroupId: fixedAssetsGroup.id,
          code: getNextLedgerCode(fixedAssetsGroup.code, 1), // 1.1.1
        },
        {
          name: "Furniture & Fixtures",
          type: "FixedAssets",
          accountGroupId: fixedAssetsGroup.id,
          code: getNextLedgerCode(fixedAssetsGroup.code, 2), // 1.1.2
        },
        {
          name: "Computer & Equipment",
          type: "FixedAssets",
          accountGroupId: fixedAssetsGroup.id,
          code: getNextLedgerCode(fixedAssetsGroup.code, 3), // 1.1.3
        },

        // Current Liabilities (2.1)
        {
          name: "Accounts Payable",
          type: "AccountsPayable",
          accountGroupId: currentLiabilitiesGroup.id,
          code: getNextLedgerCode(currentLiabilitiesGroup.code, 1), // 2.1.1
        },
        {
          name: "GST Payable",
          type: "GSTPayable",
          accountGroupId: currentLiabilitiesGroup.id,
          code: getNextLedgerCode(currentLiabilitiesGroup.code, 2), // 2.1.2
        },
        {
          name: "TDS Payable",
          type: "TDSPayable",
          accountGroupId: currentLiabilitiesGroup.id,
          code: getNextLedgerCode(currentLiabilitiesGroup.code, 3), // 2.1.3
        },

        // Capital (3)
        {
          name: "Owner's Capital",
          type: "OwnerCapital",
          accountGroupId: capitalGroup.id,
          code: getNextLedgerCode(capitalGroup.code, 1), // 3.1
        },
        {
          name: "Retained Earnings",
          type: "RetainedEarnings",
          accountGroupId: capitalGroup.id,
          code: getNextLedgerCode(capitalGroup.code, 2), // 3.2
        },

        // Direct Income (4.1)
        {
          name: "Sales",
          type: "Sales",
          accountGroupId: directIncomeGroup.id,
          code: getNextLedgerCode(directIncomeGroup.code, 1), // 4.1.1
        },

        // Direct Expenses (5.1)
        {
          name: "Purchase",
          type: "Purchase",
          accountGroupId: directExpensesGroup.id,
          code: getNextLedgerCode(directExpensesGroup.code, 1), // 5.1.1
        },

        // Indirect Expenses (5.2)
        {
          name: "Rent",
          type: "Rent",
          accountGroupId: indirectExpensesGroup.id,
          code: getNextLedgerCode(indirectExpensesGroup.code, 1), // 5.2.1
        },
        {
          name: "Electricity",
          type: "Electricity",
          accountGroupId: indirectExpensesGroup.id,
          code: getNextLedgerCode(indirectExpensesGroup.code, 2), // 5.2.2
        },
        {
          name: "Telephone",
          type: "Telephone",
          accountGroupId: indirectExpensesGroup.id,
          code: getNextLedgerCode(indirectExpensesGroup.code, 3), // 5.2.3
        },
        {
          name: "Transportation",
          type: "Transportation",
          accountGroupId: indirectExpensesGroup.id,
          code: getNextLedgerCode(indirectExpensesGroup.code, 4), // 5.2.4
        },
        {
          name: "Wages",
          type: "Wages",
          accountGroupId: indirectExpensesGroup.id,
          code: getNextLedgerCode(indirectExpensesGroup.code, 5), // 5.2.5
        },
      ];

      const createdLedgers: any[] = [];
      for (const ledger of defaultLedgers) {
        const createdLedger = await tx.ledger.create({
          data: {
            name: ledger.name,
            code: ledger.code,
            type: ledger.type as any,
            phone1: "",
            phone2: "",
            balance: 0,
            openingBalance: 0,
            accountGroupId: ledger.accountGroupId,
            branchId,
            createdBy: userId,
          },
        });
        createdLedgers.push(createdLedger);
      }

      return {
        accountGroups: createdGroups,
        subGroups: createdSubGroups,
        ledgers: createdLedgers,
      };
    });

    res.status(201).json({
      success: true,
      message: "Default account structure created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET ledger balance and trial balance
export const getTrialBalance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId, financialYearId } = req.params;

    const ledgers = await prisma.ledger.findMany({
      where: { branchId, isActive: true },
      include: {
        accountGroup: true,
        JournalEntry: {
          where: {
            isActive: true,
            journal: {
              financialYearId,
              isActive: true,
            },
          },
        },
      },
    });

    const trialBalance = ledgers.map((ledger) => {
      const debitEntries = ledger.JournalEntry.filter(
        (entry) => entry.type === "DEBIT"
      );
      const creditEntries = ledger.JournalEntry.filter(
        (entry) => entry.type === "CREDIT"
      );

      const totalDebits = debitEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );
      const totalCredits = creditEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0
      );

      const currentBalance =
        parseFloat(ledger.openingBalance.toString()) +
        totalDebits -
        totalCredits;

      return {
        id: ledger.id,
        name: ledger.name,
        code: ledger.code,
        accountGroup: ledger.accountGroup.name,
        openingBalance: parseFloat(ledger.openingBalance.toString()),
        totalDebits,
        totalCredits,
        currentBalance,
      };
    });

    const totalDebits = trialBalance.reduce(
      (sum, ledger) => sum + ledger.totalDebits,
      0
    );
    const totalCredits = trialBalance.reduce(
      (sum, ledger) => sum + ledger.totalCredits,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ledgers: trialBalance,
        totals: {
          totalDebits,
          totalCredits,
          difference: totalDebits - totalCredits,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET ledger book (all journal entries) by ledger ID
export const getLedgerBookByLedgerId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ledgerId } = req.params;
    const { financialYearId } = req.query; // optional filter

    // Fetch ledger info
    const ledger = await prisma.ledger.findUnique({
      where: { id: ledgerId },
      select: {
        id: true,
        name: true,
        openingBalance: true,
      },
    });

    if (!ledger) {
      return next(new AppError("Ledger not found", 404));
    }

    // Fetch journal entries
    const entries = await prisma.journalEntry.findMany({
      where: {
        ledgerId,
        isActive: true,
        ...(financialYearId
          ? {
              journal: {
                financialYearId: financialYearId as string,
                isActive: true,
              },
            }
          : {}),
      },
      include: {
        journal: true,
      },
      orderBy: {
        journal: { date: "asc" },
      },
    });

    let runningBalance = parseFloat(ledger.openingBalance.toString());
    const ledgerBook = [];

    for (const entry of entries) {
      const amount = parseFloat(entry.amount.toString());
      const balanceBefore = runningBalance;

      if (entry.type === "DEBIT") {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      ledgerBook.push({
        date: entry.journal.date,
        narration: entry.narration,
        type: entry.type,
        amount,
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        runningBalance: parseFloat(runningBalance.toFixed(2)),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ledger: {
          id: ledger.id,
          name: ledger.name,
          openingBalance: parseFloat(ledger.openingBalance.toString()),
        },
        entries: ledgerBook,
      },
    });
  } catch (error) {
    next(error);
  }
};
