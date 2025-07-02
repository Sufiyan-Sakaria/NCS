import api from "@/lib/axios";
import { Account } from "@/types/Account";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateAccountPayload {
  name: string;
  code: string;
  type: string;
  phone1?: string;
  phone2?: string;
  openingBalance: number;
  accountGroupId: string;
  branchId: string;
  createdBy: string;
}

export interface UpdateAccountPayload {
  id: string;
  name: string;
  code: string;
  type: string;
  phone1?: string;
  phone2?: string;
  accountGroupId: string;
  updatedBy?: string;
}

export interface DeleteAccountPayload {
  id: string;
}

export interface TrialBalanceEntry {
  id: string;
  name: string;
  code: string;
  accountGroup: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  currentBalance: number;
}

// ============ API Methods ============

// GET /api/account/ledgers/branch/:branchId
export const getAccountsByBranch = async (branchId: string): Promise<Account[]> => {
  const response: AxiosResponse<{ data: Account[] }> = await api.get(
    `/account/ledgers/branch/${branchId}`,
  );
  return response.data.data;
};

// POST /api/account/ledgers
export const createAccount = async (payload: CreateAccountPayload): Promise<Account> => {
  const response: AxiosResponse<{ data: Account }> = await api.post(`/account/ledgers`, {
    name: payload.name,
    code: payload.code,
    type: payload.type,
    phone1: payload.phone1,
    phone2: payload.phone2,
    openingBalance: payload.openingBalance,
    accountGroupId: payload.accountGroupId,
    branchId: payload.branchId,
    createdBy: payload.createdBy,
  });
  return response.data.data;
};

// PUT /api/account/ledgers/:id
export const updateAccount = async (payload: UpdateAccountPayload): Promise<Account> => {
  const response: AxiosResponse<{ data: Account }> = await api.put(
    `/account/ledgers/${payload.id}`,
    {
      name: payload.name,
      code: payload.code,
      type: payload.type,
      phone1: payload.phone1,
      phone2: payload.phone2,
      accountGroupId: payload.accountGroupId,
      ...(payload.updatedBy && { updatedBy: payload.updatedBy }),
    },
  );
  return response.data.data;
};

// DELETE /api/account/ledgers/:id
export const deleteAccount = async (payload: DeleteAccountPayload): Promise<void> => {
  await api.delete(`/account/ledgers/${payload.id}`);
};

// GET /api/account/trial-balance/:branchId/:financialYearId
export const getTrialBalance = async (
  branchId: string,
  financialYearId: string,
): Promise<TrialBalanceEntry[]> => {
  const response: AxiosResponse<{ data: TrialBalanceEntry[] }> = await api.get(
    `/account/trial-balance/${branchId}/${financialYearId}`,
  );
  return response.data.data;
};
