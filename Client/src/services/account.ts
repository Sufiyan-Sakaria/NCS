import api from "@/lib/axios";
import { AccountGroup, AccountGroupType, Nature } from "@/types/AccountGroup";
import { Ledger } from "@/types/Ledger";
import { TradingAccountData, TradingAccountResponse } from "@/types/TradingAc";
import { TrialBalance } from "@/types/TrailBalance";
import { AxiosResponse } from "axios";

// ============ Type ============

export interface FlatAccountGroup {
  id: string;
  name: string;
  code: string;
  nature: "Assets" | "Liabilities" | "Capital" | "Income" | "Expenses";
  parentId?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: FlatAccountGroup;
  children: FlatAccountGroup[];
  Ledger: Ledger[];
}

// ============ Payload Types ============

export interface CreateAccountGroupPayload {
  name: string;
  nature: Nature;
  type?: AccountGroupType | null;
  parentId?: string | null;
  branchId: string;
}

export interface UpdateAccountGroupPayload {
  id: string;
  name: string;
  type?: AccountGroupType | null;
  nature: Nature;
  parentId?: string | null;
}

export interface DeleteAccountGroupPayload {
  id: string;
}

export interface CreateLedgerPayload {
  name: string;
  type: string;
  phone1?: string;
  phone2?: string;
  openingBalance?: number;
  accountGroupId: string;
  branchId: string;
  financialYearId?: string;
}

export interface UpdateLedgerPayload {
  id: string;
  name: string;
  type: string;
  phone1?: string;
  phone2?: string;
  accountGroupId: string;
  updatedBy: string;
}

export interface DeleteLedgerPayload {
  id: string;
}

export interface CreateDefaultAccountsPayload {
  branchId: string;
}

// ============ API Methods ============

// GET /account/hierarchy/:branchId
export const getHierarchicalAccountsByBranch = async (
  branchId: string,
): Promise<AccountGroup[]> => {
  const response: AxiosResponse<{ data: AccountGroup[] }> = await api.get(
    `/account/hierarchy/${branchId}`,
  );
  return response.data.data;
};

// GET /account/groups/branch/:branchId
export const getAccountGroupsByBranch = async (branchId: string): Promise<FlatAccountGroup[]> => {
  const response: AxiosResponse<{ data: FlatAccountGroup[] }> = await api.get(
    `/account/groups/branch/${branchId}`,
  );
  return response.data.data;
};

// GET /account/groups/:id
export const getAccountGroupById = async (id: string): Promise<FlatAccountGroup> => {
  const response: AxiosResponse<{ data: FlatAccountGroup }> = await api.get(
    `/account/groups/${id}`,
  );
  return response.data.data;
};

// POST /account/groups
export const createAccountGroup = async (
  payload: CreateAccountGroupPayload,
): Promise<FlatAccountGroup> => {
  const response: AxiosResponse<{ data: FlatAccountGroup }> = await api.post(
    "/account/groups",
    payload,
  );
  return response.data.data;
};

// PUT /account/groups/:id
export const updateAccountGroup = async (
  payload: UpdateAccountGroupPayload,
): Promise<FlatAccountGroup> => {
  const { id, ...data } = payload;
  const response: AxiosResponse<{ data: FlatAccountGroup }> = await api.put(
    `/account/groups/${id}`,
    data,
  );
  return response.data.data;
};

// DELETE /account/groups/:id
export const deleteAccountGroup = async (payload: DeleteAccountGroupPayload): Promise<void> => {
  await api.delete(`/account/groups/${payload.id}`);
};

// GET /account/ledgers/branch/:branchId
export const getLedgersByBranch = async (branchId: string): Promise<Ledger[]> => {
  const response: AxiosResponse<{ data: Ledger[] }> = await api.get(
    `/account/ledgers/branch/${branchId}`,
  );
  return response.data.data;
};

// GET /account/ledgers/:id
export const getLedgerById = async (id: string): Promise<Ledger> => {
  const response: AxiosResponse<{ data: Ledger }> = await api.get(`/account/ledgers/${id}`);
  return response.data.data;
};

// POST /account/ledgers
export const createLedger = async (payload: CreateLedgerPayload): Promise<Ledger> => {
  const response: AxiosResponse<{ data: Ledger }> = await api.post("/account/ledgers", payload);
  return response.data.data;
};

// PUT /account/ledgers/:id
export const updateLedger = async (payload: UpdateLedgerPayload): Promise<Ledger> => {
  const { id, ...data } = payload;
  const response: AxiosResponse<{ data: Ledger }> = await api.put(`/account/ledgers/${id}`, data);
  return response.data.data;
};

// DELETE /account/ledgers/:id
export const deleteLedger = async (payload: DeleteLedgerPayload): Promise<void> => {
  await api.delete(`/account/ledgers/${payload.id}`);
};

// POST /account/structure/default
export const createDefaultAccounts = async (
  payload: CreateDefaultAccountsPayload,
): Promise<void> => {
  await api.post("/account/structure/default", payload);
};

// GET /account/trail-balance/:branchId/:financialYearId
export const getTrialBalance = async (
  branchId: string,
  financialYearId: string,
): Promise<TrialBalance> => {
  const response: AxiosResponse<{ data: TrialBalance }> = await api.get(
    `/account/trial-balance/${branchId}/${financialYearId}`,
  );
  return response.data.data;
};

// GET /account/trading-ac/:branchId/:financialYearId
export const getTradingAccount = async (
  branchId: string,
  financialYearId: string,
): Promise<TradingAccountData> => {
  const response: AxiosResponse<TradingAccountResponse> = await api.get(
    `/account/trading-ac/${branchId}/${financialYearId}`,
  );
  return response.data.data;
};
