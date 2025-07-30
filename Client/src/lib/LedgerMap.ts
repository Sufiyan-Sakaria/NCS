import type { LedgerType } from "@/types/Ledger";
import type { VoucherType } from "@/types/Voucher";

export const voucherTypeLedgerMap: Record<
  VoucherType,
  {
    ledger: LedgerType[];
    voucherLedger: LedgerType[];
  }
> = {
  PAYMENT: {
    ledger: [
      "AccountsPayable",
      "AccruedExpenses",
      "LoansPayable",
      "GSTPayable",
      "TDSPayable",
      "Wages",
      "Rent",
      "MiscellaneousExpenses",
    ],
    voucherLedger: ["Cash", "Bank"],
  },
  RECEIPT: {
    ledger: [
      "AccountsReceivable",
      "Sales",
      "SalesReturns",
      "InterestIncome",
      "CommissionReceived",
      "RentalIncome",
      "OtherIncome",
    ],
    voucherLedger: ["Cash", "Bank"],
  },
  JOURNAL: {
    ledger: [
      "Cash",
      "Bank",
      "AccountsReceivable",
      "AccountsPayable",
      "Sales",
      "Purchase",
      "Wages",
      "Rent",
      "Electricity",
      "Depreciation",
      "Inventory",
      "FixedAssets",
      "Drawings",
      "OwnerCapital",
      "OtherIncome",
      "MiscellaneousExpenses",
    ],
    voucherLedger: [
      "Cash",
      "Bank",
      "AccountsReceivable",
      "AccountsPayable",
      "Sales",
      "Purchase",
      "Wages",
      "Rent",
      "Electricity",
      "Depreciation",
      "Inventory",
      "FixedAssets",
      "Drawings",
      "OwnerCapital",
      "OtherIncome",
      "MiscellaneousExpenses",
    ],
  },
  CONTRA: {
    ledger: ["Cash", "Bank"],
    voucherLedger: ["Cash", "Bank"],
  },
  CREDIT_NOTE: {
    ledger: ["Sales", "AccountsReceivable"],
    voucherLedger: ["SalesReturns", "Cash", "Bank"],
  },
  DEBIT_NOTE: {
    ledger: ["Purchase", "AccountsPayable"],
    voucherLedger: ["PurchaseReturns", "Cash", "Bank"],
  },
};
