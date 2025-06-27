import api from "@/lib/axios";
import { Godown } from "@/types/Godown";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateGodownPayload {
  name: string;
  address: string;
  createdBy: string;
  branchId: string;
}

export interface UpdateGodownPayload {
  id: string;
  name: string;
  address: string;
  updatedBy?: string;
}

export interface DeleteGodownPayload {
  id: string;
}

// ============ API Methods ============

// GET /godown/:branchId
export const getGodownsByBranch = async (branchId: string): Promise<Godown[]> => {
  const response: AxiosResponse<{ data: Godown[] }> = await api.get(`/godown/${branchId}`);
  return response.data.data;
};

// POST /godown/:branchId
export const createGodown = async (payload: CreateGodownPayload): Promise<Godown> => {
  const response: AxiosResponse<{ data: Godown }> = await api.post(`/godown/${payload.branchId}`, {
    name: payload.name,
    address: payload.address,
    createdBy: payload.createdBy,
  });
  return response.data.data;
};

// PUT /godown/:id
export const updateGodown = async (payload: UpdateGodownPayload): Promise<Godown> => {
  const response: AxiosResponse<{ data: Godown }> = await api.put(`/godown/${payload.id}`, {
    name: payload.name,
    address: payload.address,
    ...(payload.updatedBy && { updatedBy: payload.updatedBy }),
  });
  return response.data.data;
};

// DELETE /godown/:id
export const deleteGodown = async (payload: DeleteGodownPayload): Promise<void> => {
  await api.delete(`/godown/${payload.id}`);
};
