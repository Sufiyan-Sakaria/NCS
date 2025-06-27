export type Product = {
  id: string;
  name: string;
  hsn: number;
  unitId: string;
  brandId: string;
  categoryId: string;
  branchId: string;
  saleRate: number;
  qty: number;
  thaan: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
