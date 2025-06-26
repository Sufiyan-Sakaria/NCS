import {
  createUnit,
  CreateUnitPayload,
  DeleteUnitPayload,
  deleteUnits,
  getUnitsByBranch,
  UpdateUnitPayload,
  updateUnits,
} from "@/services/unit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useUnits = (branchId: string | null) =>
  useQuery({
    queryKey: ["units", branchId],
    queryFn: () => getUnitsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateUnits = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) => createUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateUnits = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUnitPayload) => updateUnits(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteUnits = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteUnitPayload) => deleteUnits(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units", branchId] });
    },
  });
};
