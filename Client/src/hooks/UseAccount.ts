import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHierarchicalAccountsByBranch,
  getAccountGroupsByBranch,
  getAccountGroupById,
  createAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
  getLedgersByBranch,
  getLedgerById,
  createLedger,
  updateLedger,
  deleteLedger,
  createDefaultAccounts,
  CreateAccountGroupPayload,
  UpdateAccountGroupPayload,
  DeleteAccountGroupPayload,
  CreateLedgerPayload,
  UpdateLedgerPayload,
  DeleteLedgerPayload,
  CreateDefaultAccountsPayload,
} from "@/services/account";

// ==================== GET HIERARCHICAL ACCOUNTS ====================

export const useHierarchicalAccounts = (branchId: string | null) =>
  useQuery({
    queryKey: ["hierarchical-accounts", branchId],
    queryFn: () => getHierarchicalAccountsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== GET ACCOUNT GROUPS ====================

export const useAccountGroups = (branchId: string | null) =>
  useQuery({
    queryKey: ["account-groups", branchId],
    queryFn: () => getAccountGroupsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useAccountGroupById = (id: string | null) =>
  useQuery({
    queryKey: ["account-group", id],
    queryFn: () => getAccountGroupById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 mins
  });

// ==================== CREATE ACCOUNT GROUP ====================

export const useCreateAccountGroup = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountGroupPayload) => createAccountGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["account-groups", branchId] });
    },
  });
};

// ==================== UPDATE ACCOUNT GROUP ====================

export const useUpdateAccountGroup = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAccountGroupPayload) => updateAccountGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["account-groups", branchId] });
    },
  });
};

// ==================== DELETE ACCOUNT GROUP ====================

export const useDeleteAccountGroup = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteAccountGroupPayload) => deleteAccountGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["account-groups", branchId] });
    },
  });
};

// ==================== GET LEDGERS ====================

export const useLedgers = (branchId: string | null) =>
  useQuery({
    queryKey: ["ledgers", branchId],
    queryFn: () => getLedgersByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useLedgerById = (id: string | null) =>
  useQuery({
    queryKey: ["ledger", id],
    queryFn: () => getLedgerById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 mins
  });

// ==================== CREATE LEDGER ====================

export const useCreateLedger = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLedgerPayload) => createLedger(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["ledgers", branchId] });
    },
  });
};

// ==================== UPDATE LEDGER ====================

export const useUpdateLedger = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLedgerPayload) => updateLedger(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["ledgers", branchId] });
    },
  });
};

// ==================== DELETE LEDGER ====================

export const useDeleteLedger = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteLedgerPayload) => deleteLedger(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["ledgers", branchId] });
    },
  });
};

// ==================== CREATE DEFAULT ACCOUNTS ====================

export const useCreateDefaultAccounts = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDefaultAccountsPayload) => createDefaultAccounts(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarchical-accounts", branchId] });
      queryClient.invalidateQueries({ queryKey: ["account-groups", branchId] });
      queryClient.invalidateQueries({ queryKey: ["ledgers", branchId] });
    },
  });
};
