export interface AccountGroup {
  id: string;
  name: string;
  code: string;
  nature: string;
  balance: number;
  parentId?: string;
  parent?: AccountGroup;
  children?: AccountGroup[];
  branchId: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
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
