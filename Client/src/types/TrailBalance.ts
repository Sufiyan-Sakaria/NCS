// ============ Trial Balance Types ============

export interface TrialBalanceLedger {
  id: string;
  name: string;
  code: string;
  accountGroup: string;
  accountGroupNature: "Assets" | "Liabilities" | "Capital" | "Expenses" | "Income" | "Drawings";
  openingBalance: number;
  currentBalance: number;
  balanceAmount: number;
  balanceType: "DEBIT" | "CREDIT";
  isBalanceMatched: boolean;
  storedBalance: number;
}

export interface BalanceMismatchedLedger {
  id: string;
  name: string;
  calculated: number;
  stored: number;
}

export interface BalanceValidation {
  hasBalanceMismatches: boolean;
  mismatchedLedgers: BalanceMismatchedLedger[];
}

export interface TrialBalance {
  ledgers: TrialBalanceLedger[];
  balanceValidation: BalanceValidation;
}
