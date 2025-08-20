import { Brand } from "./Brand";
import { Category } from "./Category";
import { Godown } from "./Godown";
import { Unit } from "./Unit";

export type Product = {
  id: string;
  name: string;
  hsn: number;
  unitId: string;
  unit: Unit;
  brandId: string;
  brand: Brand;
  categoryId: string;
  category: Category;
  branchId: string;
  saleRate: number;
  previousPurchaseRate?: number;
  qty: number;
  thaan: number;
  ProductStock: ProductStock[];
  createdBy?: string | null;
  updatedBy?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductStock = {
  id: string;
  productId: string;
  product: Product;
  godownId: string;
  godown: Godown;
  unitId: string;
  unit: Unit;
  qty: number;
  thaan: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
