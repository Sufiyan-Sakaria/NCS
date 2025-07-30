import {
  createVoucher,
  CreateVoucherPayload,
  deleteVoucher,
  DeleteVoucherPayload,
  getVoucherById,
  getVoucherNumber,
  getVouchersByBranch,
  updateVoucher,
  UpdateVoucherPayload,
} from "@/services/voucher";
import { VoucherType } from "@/types/Voucher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==================== GET ====================

export const useVouchers = (branchId: string | null) =>
  useQuery({
    queryKey: ["Vouchers", branchId],
    queryFn: () => getVouchersByBranch(branchId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useVoucherById = (id: string | null) =>
  useQuery({
    queryKey: ["Voucher", id],
    queryFn: () => getVoucherById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useVoucherNumber = (branchId: string, type: VoucherType) =>
  useQuery({
    queryKey: ["VoucherNumber", branchId, type],
    queryFn: () => getVoucherNumber(branchId, type),
    enabled: !!branchId && !!type,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

// ==================== CREATE ====================

export const useCreateVoucher = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVoucherPayload) => createVoucher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Vouchers", branchId] });
    },
  });
};

// ==================== UPDATE ====================

export const useUpdateVoucher = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVoucherPayload) => updateVoucher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Vouchers", branchId] });
    },
  });
};

// ==================== DELETE ====================

export const useDeleteVoucher = (branchId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteVoucherPayload) => deleteVoucher(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Vouchers", branchId] });
    },
  });
};
