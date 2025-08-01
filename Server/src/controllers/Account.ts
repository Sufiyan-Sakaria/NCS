import {
  AccountGroupNature,
  AccountGroupType,
  Prisma,
  PrismaClient,
} from "../../generated/prisma";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { getPreBalance } from "../utils/GetPreBalance";

const prisma = new PrismaClient();

// GET all account groups by branch
export const getAccountGroupsByBranch = async (
  req: Request,
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
  req: Request,
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, nature, parentId, type, branchId } = req.body;
    const userId = req.user?.id;

    if (!name || !nature || !branchId) {
      return next(new AppError("Missing required fields", 400));
    }

    let newCode = "";

    if (parentId) {
      // Get parent group code
      const parent = await prisma.accountGroup.findUnique({
        where: { id: parentId },
        select: { code: true },
      });

      if (!parent) {
        return next(new AppError("Parent group not found", 404));
      }

      const parentCode = parent.code;

      // Fetch all children codes under this parent (both groups and ledgers)
      const [groupChildren, ledgerChildren] = await Promise.all([
        prisma.accountGroup.findMany({
          where: { parentId, branchId, isActive: true },
          select: { code: true },
        }),
        prisma.ledger.findMany({
          where: { accountGroupId: parentId, branchId, isActive: true },
          select: { code: true },
        }),
      ]);

      const suffixes = [...groupChildren, ...ledgerChildren]
        .map((item) => {
          const parts = item.code.split(".");
          return parseInt(parts[parts.length - 1], 10);
        })
        .filter((n) => !isNaN(n));

      const nextSuffix = suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;
      newCode = `${parentCode}.${nextSuffix}`;
    } else {
      // Top-level group
      const [rootGroups, rootLedgers] = await Promise.all([
        prisma.accountGroup.findMany({
          where: { parentId: null, branchId, isActive: true },
          select: { code: true },
        }),
        prisma.ledger.findMany({
          where: { accountGroup: { parentId: null }, branchId, isActive: true },
          select: { code: true },
        }),
      ]);

      const rootSuffixes = [...rootGroups, ...rootLedgers]
        .map((item) => {
          const parts = item.code.split(".");
          return parseInt(parts[0], 10);
        })
        .filter((n) => !isNaN(n));

      const nextRoot =
        rootSuffixes.length > 0 ? Math.max(...rootSuffixes) + 1 : 1;
      newCode = `${nextRoot}`;
    }

    const accountGroup = await prisma.accountGroup.create({
      data: {
        name,
        code: newCode,
        nature,
        groupType: type,
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, code, balance, nature, type, parentId } = req.body;
    const userId = req.user?.id;

    const accountGroup = await prisma.accountGroup.update({
      where: { id },
      data: {
        name,
        code,
        balance,
        nature,
        groupType: type,
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
  req: Request,
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
  req: Request,
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
  req: Request,
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
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
    if (!name || !type || !accountGroupId || !branchId) {
      return next(new AppError("Missing required fields", 400));
    }

    // Start transaction
    let capitalAccountGroupId: string | null = null;
    const result = await prisma.$transaction(async (tx) => {
      // Get parent group code
      const parentGroup = await tx.accountGroup.findUnique({
        where: { id: accountGroupId },
        select: { code: true },
      });

      if (!parentGroup) {
        throw new AppError("Account group not found", 404);
      }

      const parentCode = parentGroup.code;

      // Get sibling codes (ledgers + subgroups)
      const [groupChildren, ledgerChildren] = await Promise.all([
        tx.accountGroup.findMany({
          where: { parentId: accountGroupId, branchId, isActive: true },
          select: { code: true },
        }),
        tx.ledger.findMany({
          where: { accountGroupId, branchId, isActive: true },
          select: { code: true },
        }),
      ]);

      const suffixes = [...groupChildren, ...ledgerChildren]
        .map((item) => {
          const parts = item.code.split(".");
          return parseInt(parts[parts.length - 1], 10);
        })
        .filter((n) => !isNaN(n));

      const nextSuffix = suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;
      const newCode = `${parentCode}.${nextSuffix}`;

      // Create ledger
      const ledger = await tx.ledger.create({
        data: {
          name,
          code: newCode,
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
        // 1. Get nature of the account to determine DR/CR
        const accountGroup = await tx.accountGroup.findUnique({
          where: { id: accountGroupId },
        });

        if (!accountGroup) throw new AppError("Account group not found", 404);

        // 2. Get or Create Capital Account Group
        let capitalGroup = await tx.accountGroup.findFirst({
          where: {
            branchId,
            nature: "Capital",
            isActive: true,
          },
        });

        if (!capitalGroup) {
          const siblings = await tx.accountGroup.findMany({
            where: { branchId, parentId: null },
            select: { code: true },
          });

          const suffixes = siblings
            .map((g) => parseInt(g.code.split(".")[0]))
            .filter((n) => !isNaN(n));
          const nextCode = suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;

          capitalGroup = await tx.accountGroup.create({
            data: {
              name: "Capital",
              code: `${nextCode}`,
              nature: "Capital",
              balance: 0,
              branchId,
              createdBy: userId,
            },
          });
        }

        // 3. Get or Create Owner's Capital Ledger under Capital Group
        let capitalAccount = await tx.ledger.findFirst({
          where: {
            branchId,
            type: "OwnerCapital",
            isActive: true,
          },
        });

        if (!capitalAccount) {
          // Get sibling codes (groups and ledgers) under Capital group
          const [childGroups, childLedgers] = await Promise.all([
            tx.accountGroup.findMany({
              where: { parentId: capitalGroup.id, branchId, isActive: true },
              select: { code: true },
            }),
            tx.ledger.findMany({
              where: {
                accountGroupId: capitalGroup.id,
                branchId,
                isActive: true,
              },
              select: { code: true },
            }),
          ]);

          const suffixes = [...childGroups, ...childLedgers]
            .map((item) => {
              const parts = item.code.split(".");
              return parseInt(parts[parts.length - 1], 10);
            })
            .filter((n) => !isNaN(n));
          const nextSuffix =
            suffixes.length > 0 ? Math.max(...suffixes) + 1 : 1;

          const newCode = `${capitalGroup.code}.${nextSuffix}`;

          capitalAccount = await tx.ledger.create({
            data: {
              name: "Owner's Capital",
              code: newCode,
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
        // Track capital account's group for parent update
        if (capitalAccount && capitalAccount.accountGroupId) {
          capitalAccountGroupId = capitalAccount.accountGroupId;
        }

        // 4. Get existing journal for this branch and year
        const journal = await tx.journalBook.findFirst({
          where: {
            branchId,
            financialYearId,
            isActive: true,
          },
        });

        if (!journal) {
          throw new AppError(
            "Journal book not found for this branch and financial year",
            404
          );
        }

        // 5. Determine Debit / Credit
        const isDebitBalance = openingBalance > 0;
        const isAssetOrExpense = ["Assets", "Expenses"].includes(
          accountGroup.nature
        );

        const ledgerEntryType = isAssetOrExpense
          ? isDebitBalance
            ? "DEBIT"
            : "CREDIT"
          : isDebitBalance
          ? "CREDIT"
          : "DEBIT";

        const capitalEntryType =
          ledgerEntryType === "DEBIT" ? "CREDIT" : "DEBIT";

        // 6. Create Journal Entries
        const now = new Date();

        const preBalanceLedger = await getPreBalance(tx, ledger.id, now);
        const preBalanceCapital = await getPreBalance(
          tx,
          capitalAccount.id,
          now
        );

        await tx.journalEntry.create({
          data: {
            journalBookId: journal.id,
            ledgerId: ledger.id,
            type: ledgerEntryType,
            amount: Math.abs(openingBalance),
            preBalance: preBalanceLedger,
            narration: `Opening balance`,
            createdBy: userId,
            date: now,
          },
        });

        await tx.journalEntry.create({
          data: {
            journalBookId: journal.id,
            ledgerId: capitalAccount.id,
            type: capitalEntryType,
            amount: Math.abs(openingBalance),
            preBalance: preBalanceCapital,
            narration: `Contra entry for ${ledger.name} opening balance`,
            createdBy: userId,
            date: now,
          },
        });

        // 7. Update Capital Ledger Balance
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

      // Helper: Recursively update parent group balances
      async function updateParentBalances(groupId: string) {
        if (!groupId) return;
        // Get all direct child ledgers and groups
        const [childGroups, childLedgers] = await Promise.all([
          tx.accountGroup.findMany({
            where: { parentId: groupId, branchId, isActive: true },
            select: { id: true, balance: true },
          }),
          tx.ledger.findMany({
            where: { accountGroupId: groupId, branchId, isActive: true },
            select: { balance: true },
          }),
        ]);
        // Sum balances
        let total = 0;
        for (const g of childGroups) total += Number(g.balance);
        for (const l of childLedgers) total += Number(l.balance);
        // Update this group
        await tx.accountGroup.update({
          where: { id: groupId },
          data: { balance: total },
        });
        // Get parent and recurse
        const parent = await tx.accountGroup.findUnique({
          where: { id: groupId },
          select: { parentId: true },
        });
        if (parent?.parentId) {
          await updateParentBalances(parent.parentId);
        }
      }

      // After ledger creation, update parent balances for the main group
      await updateParentBalances(accountGroupId);

      // If a capitalAccount was created or found, update its parent balances as well
      if (capitalAccountGroupId) {
        await updateParentBalances(capitalAccountGroupId);
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
  req: Request,
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
  req: Request,
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

// CREATE default account structure with groupType and hierarchy
export const createDefaultAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.body;
    const userId = req.user?.id;

    if (!branchId) {
      return next(new AppError("Branch ID is required", 400));
    }

    const accountGroupStructure: Record<
      AccountGroupNature,
      AccountGroupType[]
    > = {
      Assets: ["FixedAssets", "CurrentAssets"],
      Liabilities: ["CurrentLiabilities"],
      Capital: [],
      Income: ["DirectIncomes", "IndirectIncomes"],
      Expenses: ["DirectExpenses", "IndirectExpenses"],
      Drawings: [],
    };

    const result = await prisma.$transaction(async (tx) => {
      let codeCounter = 1;
      const mainGroups: any[] = [];
      const subGroups: {
        id: string;
        name: string;
        code: string;
        nature: AccountGroupNature;
        groupType: AccountGroupType;
        parentId: string;
        branchId: string;
        createdBy?: string;
        balance: number;
      }[] = [];

      for (const [natureKey, groupTypes] of Object.entries(
        accountGroupStructure
      )) {
        const nature = natureKey as AccountGroupNature;
        const parentId = crypto.randomUUID();
        const parentCode = `${codeCounter}`;

        mainGroups.push({
          id: parentId,
          name: nature,
          code: parentCode,
          nature,
          groupType: null,
          parentId: null,
          balance: 0,
          branchId,
          createdBy: userId,
        });

        groupTypes.forEach((groupType, index) => {
          // Convert camel-case enum string to spaced name (e.g., FixedAssets -> Fixed Assets)
          const readableName = groupType.replace(/([a-z])([A-Z])/g, "$1 $2");

          subGroups.push({
            id: crypto.randomUUID(),
            name: readableName,
            code: `${parentCode}.${index + 1}`,
            nature,
            groupType,
            parentId,
            balance: 0,
            branchId,
            createdBy: userId,
          });
        });

        codeCounter++;
      }

      await tx.accountGroup.createMany({
        data: [...mainGroups, ...subGroups],
      });

      return {
        mainGroups: mainGroups.length,
        subGroups: subGroups.length,
      };
    });

    res.status(201).json({
      success: true,
      message: "Default simplified account structure created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET ledger balance and trial balance
export const getTrialBalance = async (
  req: Request,
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
  req: Request,
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
        date: entry.date,
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

// GET hierarchical account structure (groups + ledgers) by branch
export const getHierarchicalAccountsByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    // Step 1: Get all active account groups and ledgers
    const allGroups = await prisma.accountGroup.findMany({
      where: { branchId, isActive: true },
      include: {
        Ledger: {
          where: { isActive: true },
          orderBy: { code: "asc" },
        },
      },
      orderBy: { code: "asc" },
    });

    // Step 2: Build a map of groups by id
    const groupMap = new Map<string, any>();
    allGroups.forEach((group) => {
      groupMap.set(group.id, {
        id: group.id,
        name: group.name,
        code: group.code,
        nature: group.nature,
        type: group.groupType,
        parentId: group.parentId,
        balance: group.balance,
        ledgers: group.Ledger,
        children: [],
      });
    });

    // Step 3: Build hierarchy
    const roots: any[] = [];
    for (const group of groupMap.values()) {
      if (group.parentId) {
        const parent = groupMap.get(group.parentId);
        if (parent) {
          parent.children.push(group);
        }
      } else {
        roots.push(group);
      }
    }

    res.status(200).json({
      success: true,
      data: roots.sort((a, b) => a.code.localeCompare(b.code)),
    });
  } catch (error) {
    next(error);
  }
};
