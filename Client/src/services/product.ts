import api from "@/lib/axios";
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
