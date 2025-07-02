import {
  createAccount,
  CreateAccountPayload,
  deleteAccount,
  DeleteAccountPayload,
  getAccountsByBranch,
  getTrialBalance,
  updateAccount,
  UpdateAccountPayload,
} from "@/services/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useAccounts = (branchId: string | null) =>
  useQuery({
    queryKey: ["account", branchId],
    queryFn: () => getAccountsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateAccount = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", branchId] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateAccount = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAccountPayload) => updateAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", branchId] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteAccount = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteAccountPayload) => deleteAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account", branchId] });
      queryClient.invalidateQueries({ queryKey: ["trialBalance", branchId] });
    },
  });
};

// ==================== TRIAL BALANCE ====================

export const useTrialBalance = (branchId: string | null, financialYearId: string | null) =>
  useQuery({
    queryKey: ["trialBalance", branchId, financialYearId],
    queryFn: () => getTrialBalance(branchId!, financialYearId!),
    enabled: !!branchId && !!financialYearId,
  });
