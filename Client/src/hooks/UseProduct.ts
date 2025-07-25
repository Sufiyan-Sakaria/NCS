import {
  createProduct,
  CreateProductPayload,
  deleteProduct,
  DeleteProductPayload,
  getProductsByBranch,
  getProductStock,
  updateProduct,
  UpdateProductPayload,
} from "@/services/product";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== PRODUCT STOCK ====================
export const useProductStock = (branchId: string | null, productId?: string, godownId?: string) =>
  useQuery({
    queryKey: ["product-stock", branchId, productId, godownId],
    queryFn: () => getProductStock(branchId!, productId, godownId),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 4 * 60 * 1000,
  });

// ==================== GET ====================

export const useProducts = (branchId: string | null) =>
  useQuery({
    queryKey: ["product", branchId],
    queryFn: () => getProductsByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateProduct = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateProduct = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteProduct = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteProductPayload) => deleteProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", branchId] });
    },
  });
};
