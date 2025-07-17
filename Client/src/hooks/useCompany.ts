import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  DeleteCompanyPayload,
} from "@/services/company";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ==================== GET ALL ====================

export const useCompanies = () =>
  useQuery({
    queryKey: ["company"],
    queryFn: getAllCompanies,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 9 * 60 * 1000,
  });

// ==================== GET BY ID ====================

export const useCompany = (id: string | null) =>
  useQuery({
    queryKey: ["company", id],
    queryFn: () => getCompanyById(id!),
    enabled: !!id,
  });

// ==================== CREATE ====================

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => createCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => updateCompany(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["company", payload.id] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteCompanyPayload) => deleteCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
  });
};
