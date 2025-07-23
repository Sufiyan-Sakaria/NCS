import { Ledger } from "./Ledger";
import { User } from "./User";

export type InvoiceType = "SALE" | "PURCHASE" | "SALE_RETURN" | "PURCHASE_RETURN";

export type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  type: InvoiceType;
  invoiceBookId: string;
  ledgerId: string;
  ledger: Ledger;
  invoiceLedgerId: string;
  invoiceLedger: Ledger;
  totalAmount: number;
  discount: number;
  cartage: number;
  grandTotal: number;
  narration: string | null;
  createdBy: string;
  updatedBy: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: User;
};
