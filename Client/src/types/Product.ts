import { Brand } from "./Brand";
import { Category } from "./Category";

export type Product = {
  id: string;
  name: string;
  hsn: number;
  unitId: string;
  brandId: string;
  brand: Brand;
  categoryId: string;
  category: Category;
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
