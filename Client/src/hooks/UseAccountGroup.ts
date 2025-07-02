import {
  createAccountGroup,
  CreateAccountGroupPayload,
  deleteAccountGroup,
  DeleteAccountGroupPayload,
  getAccountGroupsByBranch,
  updateAccountGroup,
  UpdateAccountGroupPayload,
} from "@/services/accountGroup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useAccountGroups = (branchId: string | null) =>
  useQuery({
    queryKey: ["accountGroup", branchId],
    queryFn: () => getAccountGroupsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateAccountGroup = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountGroupPayload) => createAccountGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountGroup", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateAccountGroup = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAccountGroupPayload) => updateAccountGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountGroup", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteAccountGroup = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteAccountGroupPayload) => deleteAccountGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountGroup", branchId] });
    },
  });
};
