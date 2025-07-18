import { z } from "zod";

export const accountGroupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nature: z.enum(["Assets", "Liabilities", "Capital", "Income", "Expenses"]),
  parentId: z.string().optional().nullable(),
  type: z
    .enum([
      "CapitalAccount",
      "LoansLiabilities",
      "CurrentLiabilities",
      "FixedAssets",
      "Investments",
      "CurrentAssets",
      "BranchDivisions",
      "MiscExpensesAssets",
      "SalesAccounts",
      "PurchaseAccounts",
      "DirectIncomes",
      "IndirectIncomes",
      "DirectExpenses",
      "IndirectExpenses",
      "SuspenseAccount",
      "DutiesTaxes",
      "Provisions",
      "BankAccounts",
      "CashInHand",
      "Deposits",
      "SecuredLoans",
      "UnsecuredLoans",
      "AccountsReceivable",
      "AccountsPayable",
    ])
    .optional()
    .nullable(),
});

export type AccountGroupFormValues = z.infer<typeof accountGroupFormSchema>;
