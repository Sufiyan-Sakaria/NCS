export type Unit = {
  id: string;
  name: string;
  abb: string;
  branchId: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdByUser?: {
    id: string;
    name: string;
  };
};
