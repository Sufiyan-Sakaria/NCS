import {
  createGodown,
  CreateGodownPayload,
  deleteGodown,
  DeleteGodownPayload,
  getGodownsByBranch,
  updateGodown,
  UpdateGodownPayload,
} from "@/services/godown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useGodowns = (branchId: string | null) =>
  useQuery({
    queryKey: ["godown", branchId],
    queryFn: () => getGodownsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateGodown = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGodownPayload) => createGodown(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godown", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateGodown = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGodownPayload) => updateGodown(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godown", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteGodown = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteGodownPayload) => deleteGodown(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["godown", branchId] });
    },
  });
};
