import api from "@/lib/axios";
import { Brand } from "@/types/Brand";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateBrandPayload {
  name: string;
  abb: string;
  branchId: string;
}

export interface UpdateBrandPayload {
  id: string;
  name: string;
  abb: string;
}

export interface DeleteBrandPayload {
  id: string;
}

// ============ API Methods ============

// GET /brand/:branchId
export const getBrandByBranch = async (branchId: string): Promise<Brand[]> => {
  const response: AxiosResponse<{ data: Brand[] }> = await api.get(`/brand/${branchId}`);
  return response.data.data;
};

// POST /brand/:branchId
export const createBrand = async (payload: CreateBrandPayload): Promise<Brand> => {
  const response: AxiosResponse<{ data: Brand }> = await api.post(`/brand/${payload.branchId}`, {
    name: payload.name,
    abb: payload.abb,
  });
  return response.data.data;
};

// PUT /brand/:id
export const updateBrand = async (payload: UpdateBrandPayload): Promise<Brand> => {
  const response: AxiosResponse<{ data: Brand }> = await api.put(`/brand/${payload.id}`, {
    name: payload.name,
    abb: payload.abb,
  });
  return response.data.data;
};

// DELETE /brand/:id
export const deleteBrand = async ({ id }: DeleteBrandPayload): Promise<void> => {
  await api.delete(`/brand/${id}`);
};
