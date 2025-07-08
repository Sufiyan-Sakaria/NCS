import { AccountGroup } from "./AccountGroup";

export interface Ledger {
  id: string;
  name: string;
  code: string;
  type: string;
  phone1?: string;
  phone2?: string;
  balance: number;
  openingBalance: number;
  accountGroupId: string;
  accountGroup?: AccountGroup;
  branchId: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
