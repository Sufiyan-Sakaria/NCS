export type Godown = {
  id: string;
  name: string;
  address: string;
  branchId: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdByUser: {
    id: string;
    name: string;
  };
};
