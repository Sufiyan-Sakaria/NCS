import { Ledger } from "./Ledger";

export type Nature = "Assets" | "Liabilities" | "Capital" | "Income" | "Expenses";

export interface AccountGroup {
  id: string;
  name: string;
  code: string;
  nature: Nature;
  parentId?: string | null;
  branchId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  children: AccountGroup[];
  ledgers: Ledger[];
}

export interface EditableAccountGroup {
  id: string;
  name: string;
  code: string;
  nature: Nature;
  parentId?: string | null;
  branchId: string;
}
