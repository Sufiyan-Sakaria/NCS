import api from "@/lib/axios";
import { Voucher, VoucherType } from "@/types/Voucher";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateVoucherPayload {
  date: string; // ISO format string, e.g. "2025-07-23T00:00:00.000Z"
  type: VoucherType;
  reference?: string;
  narration?: string;
  totalAmount: number;
  entries: {
    ledgerId: string;
    voucherLedgerId: string;
    amount: number;
    narration?: string;
  }[];
  branchId: string; // Branch ID
}

export interface UpdateVoucherPayload {
  id: string; // Voucher ID
  date: string; // ISO format string, e.g. "2025-07-23T00:00:00.000Z"
  type: VoucherType;
  reference?: string;
  narration?: string;
  totalAmount: number;
  entries: {
    ledgerId: string;
    voucherId: string;
    amount: number;
    narration?: string;
  }[];
  branchId: string; // Branch ID
}

export interface DeleteVoucherPayload {
  id: string;
}

// ============ API Methods ============

export const getVouchersByBranch = async (branchId: string): Promise<Voucher[]> => {
  const response: AxiosResponse<{ data: Voucher[] }> = await api.get(`/voucher/${branchId}`);
  return response.data.data;
};

export const getVoucherById = async (id: string): Promise<Voucher> => {
  const response: AxiosResponse<{ data: Voucher }> = await api.get(`/voucher/${id}`);
  return response.data.data;
};

export const getVoucherNumber = async (branchId: string, type: VoucherType): Promise<string> => {
  const response: AxiosResponse<{ data: string }> = await api.get(`/voucher/number/${branchId}`, {
    params: { type },
  });
  return response.data.data;
};

export const createVoucher = async (payload: CreateVoucherPayload): Promise<Voucher> => {
  const response: AxiosResponse<{ data: Voucher }> = await api.post(
    `/voucher/${payload.branchId}`,
    payload,
  );
  return response.data.data;
};

export const updateVoucher = async (payload: UpdateVoucherPayload): Promise<Voucher> => {
  const response: AxiosResponse<{ data: Voucher }> = await api.put(
    `/voucher/${payload.id}`,
    payload,
  );
  return response.data.data;
};

export const deleteVoucher = async (payload: DeleteVoucherPayload): Promise<void> => {
  await api.delete(`/Voucher/${payload.id}`);
};
