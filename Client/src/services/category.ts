import api from "@/lib/axios";
import { Category } from "@/types/Category";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateCategoryPayload {
  name: string;
  abb: string;
  branchId: string;
}

export interface UpdateCategoryPayload {
  id: string;
  name: string;
  abb: string;
}

export interface DeleteCategoryPayload {
  id: string;
}

// ============ API Methods ============

// GET /category/:branchId
export const getCategoryByBranch = async (branchId: string): Promise<Category[]> => {
  const response: AxiosResponse<{ data: Category[] }> = await api.get(`/category/${branchId}`);
  return response.data.data;
};

// POST /category/:branchId
export const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
  const response: AxiosResponse<{ data: Category }> = await api.post(
    `/category/${payload.branchId}`,
    {
      name: payload.name,
      abb: payload.abb,
    },
  );
  return response.data.data;
};

// PUT /category/:id
export const updateCategory = async (payload: UpdateCategoryPayload): Promise<Category> => {
  const response: AxiosResponse<{ data: Category }> = await api.put(`/category/${payload.id}`, {
    name: payload.name,
    abb: payload.abb,
  });
  return response.data.data;
};

// DELETE /category/:id
export const deleteCategory = async (payload: DeleteCategoryPayload): Promise<void> => {
  await api.delete(`/category/${payload.id}`);
};
