// Base interfaces
interface Ledger {
  id: string;
  name: string;
  code: string;
  accountGroup: string;
  accountGroupType: string;
  accountGroupNature: string;
  openingBalance: number;
  netBalance: number;
  balanceAmount: number;
  totalDebits: number;
  totalCredits: number;
}

interface LedgerCategory {
  ledgers: Ledger[];
  total: number;
}

interface StockItem {
  amount: number;
  label: string;
}

interface ProfitLossItem {
  amount: number;
  label: string;
}

// Trading account structure interfaces
interface DebitSide {
  openingStock: StockItem;
  purchases: LedgerCategory;
  directExpenses: LedgerCategory;
  grossProfit: ProfitLossItem | null;
  total: number;
}

interface CreditSide {
  sales: LedgerCategory;
  directIncomes: LedgerCategory;
  closingStock: StockItem;
  grossLoss: ProfitLossItem | null;
  total: number;
}

interface TradingAccountSummary {
  costOfGoodsSold: number;
  grossProfit: number;
  isGrossProfit: boolean;
  isBalanced: boolean;
}

interface TradingAccount {
  debitSide: DebitSide;
  creditSide: CreditSide;
  summary: TradingAccountSummary;
}

// Main response interfaces
interface TradingAccountData {
  tradingAccount: TradingAccount;
  financialYearId: string;
  branchId: string;
  generatedAt: string; // ISO string
}

interface TradingAccountResponse {
  success: boolean;
  data: TradingAccountData;
}

// Error response type (for consistency)
interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

// Union type for all possible responses
type ApiResponse = TradingAccountResponse | ErrorResponse;

// Example usage types for frontend components
interface TradingAccountProps {
  data: TradingAccountData;
}

interface LedgerTableProps {
  ledgers: Ledger[];
  title: string;
  total: number;
}

// Hook return type if using custom hooks
interface UseTradingAccountReturn {
  data: TradingAccountData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Export all types
export type {
  Ledger,
  LedgerCategory,
  StockItem,
  ProfitLossItem,
  DebitSide,
  CreditSide,
  TradingAccount,
  TradingAccountSummary,
  TradingAccountData,
  TradingAccountResponse,
  ErrorResponse,
  ApiResponse,
  TradingAccountProps,
  LedgerTableProps,
  UseTradingAccountReturn,
};
