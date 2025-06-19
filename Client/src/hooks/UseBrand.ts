import {
  getBrandByBranch,
  createBrand,
  updateBrand,
  deleteBrand,
  CreateBrandPayload,
  UpdateBrandPayload,
  DeleteBrandPayload,
} from "@/services/brand";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useBrands = (branchId: string | null) =>
  useQuery({
    queryKey: ["brands", branchId],
    queryFn: () => getBrandByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateBrand = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBrandPayload) => createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateBrand = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBrandPayload) => updateBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteBrand = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteBrandPayload) => deleteBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands", branchId] });
    },
  });
};
