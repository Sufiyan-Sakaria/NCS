import {
  createInvoice,
  CreateInvoicePayload,
  deleteInvoice,
  DeleteInvoicePayload,
  getInvoiceById,
  getInvoiceNumber,
  getInvoicesByBranch,
  updateInvoice,
  UpdateInvoicePayload,
} from "@/services/invoice";
import { InvoiceType } from "@/types/Invoice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useInvoices = (branchId: string | null) =>
  useQuery({
    queryKey: ["invoices", branchId],
    queryFn: () => getInvoicesByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useInvoiceById = (id: string | null) =>
  useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoiceById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useInvoiceNumber = (branchId: string, type: InvoiceType) =>
  useQuery({
    queryKey: ["invoiceNumber", branchId, type],
    queryFn: () => getInvoiceNumber(branchId, type),
    enabled: !!branchId && !!type,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateinvoice = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateinvoice = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInvoicePayload) => updateInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteinvoice = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteInvoicePayload) => deleteInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", branchId] });
    },
  });
};
