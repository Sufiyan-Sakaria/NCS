import api from "@/lib/axios";
import { Unit } from "@/types/Unit";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateUnitPayload {
  name: string;
  abb: string;
  createdBy: string;
  branchId: string;
}

export interface UpdateUnitPayload {
  id: string;
  name: string;
  abb: string;
  updatedBy?: string;
}

export interface DeleteUnitPayload {
  id: string;
}

// ============ API Methods ============

// GET /unit/:branchId
export const getUnitsByBranch = async (branchId: string): Promise<Unit[]> => {
  const response: AxiosResponse<{ data: Unit[] }> = await api.get(`/unit/${branchId}`);
  return response.data.data;
};

// POST /unit/:branchId
export const createUnit = async (payload: CreateUnitPayload): Promise<Unit> => {
  const response: AxiosResponse<{ data: Unit }> = await api.post(`/unit/${payload.branchId}`, {
    name: payload.name,
    abb: payload.abb,
    createdBy: payload.createdBy,
  });
  return response.data.data;
};

// PUT /unit/:id
export const updateUnits = async (payload: UpdateUnitPayload): Promise<Unit> => {
  const response: AxiosResponse<{ data: Unit }> = await api.put(`/unit/${payload.id}`, {
    name: payload.name,
    abb: payload.abb,
    ...(payload.updatedBy && { updatedBy: payload.updatedBy }),
  });
  return response.data.data;
};

// DELETE /unit/:id
export const deleteUnits = async (payload: DeleteUnitPayload): Promise<void> => {
  await api.delete(`/unit/${payload.id}`);
};
