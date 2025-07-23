import api from "@/lib/axios";
import { Godown } from "@/types/Godown";
import { Product } from "@/types/Product";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateProductPayload {
  name: string;
  unitId: string;
  brandId: string;
  categoryId: string;
  saleRate: number;
  branchId: string;
  createdBy: string;
  initialStocks?: {
    godownId: string;
    qty: number;
    thaan: number;
    rate: number;
  }[];
}

export interface UpdateProductPayload {
  id: string;
  name: string;
  unitId: string;
  brandId: string;
  categoryId: string;
  saleRate: number;
  updatedBy?: string;
}

export interface DeleteProductPayload {
  id: string;
}

// ============ API Methods ============

// GET /product/:branchId
export const getProductsByBranch = async (branchId: string): Promise<Product[]> => {
  const response: AxiosResponse<{ data: Product[] }> = await api.get(`/product/${branchId}`);
  return response.data.data;
};

// GET /product/:branchId/stocks
export interface ProductStockSummary {
  totalQty: number;
  totalThaan: number;
  currentQty: number;
  currentThaan: number;
}

export interface ProductStockEntry {
  _key: string;
  productId: string;
  product: Product;
  godownId: string;
  godown: Godown;
  qty: number;
  thaan: number;
}

export interface ProductStockResponse {
  entries: ProductStockEntry[];
  totalEntries: number;
  summary: ProductStockSummary;
}

export const getProductStock = async (
  branchId: string,
  productId?: string,
  godownId?: string,
): Promise<ProductStockResponse> => {
  const params: Record<string, string> = {};
  if (productId) params.productId = productId;
  if (godownId) params.godownId = godownId;
  const response: AxiosResponse<{ data: ProductStockResponse }> = await api.get(
    `/product/${branchId}/stocks`,
    {
      params,
    },
  );
  return response.data.data;
};

// POST /product/:branchId
export const createProduct = async (payload: CreateProductPayload): Promise<Product> => {
  const response: AxiosResponse<{ data: Product }> = await api.post(
    `/product/${payload.branchId}`,
    {
      name: payload.name,
      unitId: payload.unitId,
      brandId: payload.brandId,
      categoryId: payload.categoryId,
      saleRate: payload.saleRate,
      createdBy: payload.createdBy,
      initialStocks: payload.initialStocks,
    },
  );
  return response.data.data;
};

// PUT /product/:id
export const updateProduct = async (payload: UpdateProductPayload): Promise<Product> => {
  const response: AxiosResponse<{ data: Product }> = await api.put(`/product/${payload.id}`, {
    name: payload.name,
    unitId: payload.unitId,
    brandId: payload.brandId,
    categoryId: payload.categoryId,
    saleRate: payload.saleRate,
    ...(payload.updatedBy && { updatedBy: payload.updatedBy }),
  });
  return response.data.data;
};

// DELETE /product/:id
export const deleteProduct = async (payload: DeleteProductPayload): Promise<void> => {
  await api.delete(`/product/${payload.id}`);
};
