import { Godown } from "./Godown";
import { JournalEntry } from "./Journal";
import { Ledger } from "./Ledger";
import { Product } from "./Product";
import { Unit } from "./Unit";
import { User } from "./User";

export type InvoiceType = "SALE" | "PURCHASE" | "SALE_RETURN" | "PURCHASE_RETURN";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  type: InvoiceType;
  invoiceBookId: string;
  ledger: Ledger;
  ledgerId: string;
  invoiceLedgerId: string;
  invoiceLedger: Ledger;
  totalAmount: number;
  discount: number;
  cartage: number;
  taxAmount: number;
  grandTotal: number;
  narration: string | null;
  items: InvoiceItem[];
  createdBy: string;
  updatedBy: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: User;
  JournalEntry: JournalEntry;
}

export interface InvoiceItem {
  id: string;
  invoice: Invoice;
  invoiceId: string;
  product: Product;
  productId: string;
  quantity: number;
  thaan: number;
  godown: Godown;
  godownId: string;
  rate: number;
  discount: number;
  taxAmount: number;
  amount: number;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: User;
  updatedByUser?: User;
  Unit: Unit;
  unitId: string;
}
