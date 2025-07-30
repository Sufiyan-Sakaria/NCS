import { User } from "@/types/User";
import { Invoice } from "@/types/Invoice";
import { FinancialYear } from "./FinancialYear";
import { Branch } from "./Branch";
import { Ledger } from "./Ledger";

export interface Voucher {
  id: string;
  voucherNumber: string;
  date: string; // ISO string, e.g., "2025-07-30T00:00:00.000Z"
  type: VoucherType;
  voucherBookId: string;
  voucherBook: VoucherBook;
  reference?: string;
  narration?: string;
  totalAmount: number;
  entries: VoucherEntry[];
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  createdByUser?: User;
  updatedByUser?: User;

  invoiceId?: string;
  invoice?: Invoice;
}

export interface VoucherBook {
  id: string;
  yearLabel: string;
  financialYearId: string;
  financialYear: FinancialYear;
  branchId: string;
  branch: Branch;
  type: VoucherType;
  vouchers: Voucher[];
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string;

  createdByUser?: User;
  updatedByUser?: User;
}

export interface VoucherEntry {
  id: string;
  voucherId: string;
  voucher: Voucher;
  ledgerId: string;
  ledger: Ledger;
  voucherLedgerId: string;
  voucherLedger: Ledger;
  type: EntryType;
  amount: number;
  narration?: string;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  createdByUser?: User;
  updatedByUser?: User;
}

export const EntryType = {
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
} as const;

export type EntryType = (typeof EntryType)[keyof typeof EntryType];

export const VoucherType = {
  PAYMENT: "PAYMENT",
  RECEIPT: "RECEIPT",
  JOURNAL: "JOURNAL",
  CONTRA: "CONTRA",
  CREDIT_NOTE: "CREDIT_NOTE",
  DEBIT_NOTE: "DEBIT_NOTE",
} as const;

export type VoucherType = keyof typeof VoucherType;
