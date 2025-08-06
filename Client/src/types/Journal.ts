import { Branch } from "./Branch";
import { FinancialYear } from "./FinancialYear";
import { Invoice } from "./Invoice";
import { Ledger } from "./Ledger";
import { User } from "./User";
import { EntryType, Voucher } from "./Voucher";

export interface JournalBook {
  id: string;
  yearLabel: string;
  financialYear: FinancialYear;
  financialYearId: string;
  branch: Branch;
  branchId: string;
  entries: JournalEntry[];
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  createdByUser?: User;
  updatedByUser?: User;
}

export interface JournalEntry {
  id: string;
  date: Date;
  journal: JournalBook;
  journalBookId: string;
  ledger: Ledger;
  ledgerId: string;
  invoice?: Invoice;
  invoiceId?: string;
  voucher?: Voucher;
  voucherId?: string;
  type: EntryType;
  amount: number;
  preBalance: number;
  narration?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  createdByUser?: User;
  updatedByUser?: User;
}
