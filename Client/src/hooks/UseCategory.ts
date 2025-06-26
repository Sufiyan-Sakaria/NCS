import {
  createCategory,
  CreateCategoryPayload,
  deleteCategory,
  DeleteCategoryPayload,
  getCategoryByBranch,
  updateCategory,
  UpdateCategoryPayload,
} from "@/services/category";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useCategories = (branchId: string | null) =>
  useQuery({
    queryKey: ["categories", branchId],
    queryFn: () => getCategoryByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateCategory = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateCategory = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCategoryPayload) => updateCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteCategory = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteCategoryPayload) => deleteCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", branchId] });
    },
  });
};
