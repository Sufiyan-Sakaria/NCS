// ============ Trial Balance Types ============

export interface TrialBalanceLedger {
  id: string;
  name: string;
  code: string;
  accountGroup: string;
  accountGroupNature: "assets" | "liabilities" | "capital" | "expenses" | "income" | "drawings";
  openingBalance: number;
  currentBalance: number;
  balanceAmount: number;
  balanceType: "DEBIT" | "CREDIT";
  isBalanceMatched: boolean;
  storedBalance: number;
}

export interface TrialBalanceTotals {
  totalDebitBalance: number;
  totalCreditBalance: number;
  difference: number;
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
  totals: TrialBalanceTotals;
  balanceValidation: BalanceValidation;
}
