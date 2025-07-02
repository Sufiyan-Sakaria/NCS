import api from "@/lib/axios";
import { AccountGroup } from "@/types/Account";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateAccountGroupPayload {
  name: string;
  code: string;
  nature: string;
  parentId?: string;
  branchId: string;
  createdBy: string;
}

export interface UpdateAccountGroupPayload {
  id: string;
  name: string;
  code: string;
  nature: string;
  parentId?: string;
  updatedBy?: string;
}

export interface DeleteAccountGroupPayload {
  id: string;
}

// ============ API Methods ============

// GET /api/account/groups/branch/:branchId
export const getAccountGroupsByBranch = async (branchId: string): Promise<AccountGroup[]> => {
  const response: AxiosResponse<{ data: AccountGroup[] }> = await api.get(
    `/account/groups/branch/${branchId}`,
  );
  return response.data.data;
};

// POST /api/account/groups
export const createAccountGroup = async (
  payload: CreateAccountGroupPayload,
): Promise<AccountGroup> => {
  const response: AxiosResponse<{ data: AccountGroup }> = await api.post(`/account/groups`, {
    name: payload.name,
    code: payload.code,
    nature: payload.nature,
    parentId: payload.parentId,
    branchId: payload.branchId,
    createdBy: payload.createdBy,
  });
  return response.data.data;
};

// PUT /api/account/groups/:id
export const updateAccountGroup = async (
  payload: UpdateAccountGroupPayload,
): Promise<AccountGroup> => {
  const response: AxiosResponse<{ data: AccountGroup }> = await api.put(
    `/account/groups/${payload.id}`,
    {
      name: payload.name,
      code: payload.code,
      nature: payload.nature,
      parentId: payload.parentId,
      ...(payload.updatedBy && { updatedBy: payload.updatedBy }),
    },
  );
  return response.data.data;
};

// DELETE /api/account/groups/:id
export const deleteAccountGroup = async (payload: DeleteAccountGroupPayload): Promise<void> => {
  await api.delete(`/account/groups/${payload.id}`);
};
