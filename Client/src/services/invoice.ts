import api from "@/lib/axios";
import { Invoice, InvoiceType } from "@/types/Invoice";
import { AxiosResponse } from "axios";

// ============ Payload Types ============

export interface CreateInvoicePayload {
  date: string; // ISO format string, e.g. "2025-07-23T00:00:00.000Z"
  type: InvoiceType;
  ledgerId: string; // Customer or Supplier Ledger ID
  invoiceLedgerId: string; // Sales or Purchase Ledger ID
  totalAmount: number;
  discount?: number;
  cartage?: number;
  grandTotal: number;
  narration?: string;
  items: {
    productId: string;
    quantity: number;
    rate: number;
    thaan?: number;
    godownId: string;
  }[];
  branchId: string; // Branch ID
}

export interface UpdateInvoicePayload {
  id: string; // Invoice ID
  invoiceNumber: string;
  date: string;
  type: InvoiceType;
  invoiceLedgerId: string;
  invoiceBookId: string;
  ledgerId: string;
  totalAmount: number;
  discount?: number;
  cartage?: number;
  grandTotal: number;
  narration?: string;
  updatedBy: string;
  items: {
    productId: string;
    quantity: number;
    rate: number;
    thaan?: number;
    godownId: string;
  }[];
}

export interface DeleteInvoicePayload {
  id: string;
}

// ============ API Methods ============

export const getInvoicesByBranch = async (branchId: string): Promise<Invoice[]> => {
  const response: AxiosResponse<{ data: Invoice[] }> = await api.get(`/invoice/${branchId}`);
  return response.data.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  const response: AxiosResponse<{ data: Invoice }> = await api.get(`/invoice/single/${id}`);
  return response.data.data;
};

export const getInvoiceNumber = async (branchId: string, type: InvoiceType): Promise<string> => {
  const response: AxiosResponse<{ data: string }> = await api.get(`/invoice/number/${branchId}`, {
    params: { type },
  });
  return response.data.data;
};

export const createInvoice = async (payload: CreateInvoicePayload): Promise<Invoice> => {
  const response: AxiosResponse<{ data: Invoice }> = await api.post(
    `/invoice/${payload.branchId}`,
    payload,
  );
  return response.data.data;
};

export const updateInvoice = async (payload: UpdateInvoicePayload): Promise<Invoice> => {
  const response: AxiosResponse<{ data: Invoice }> = await api.put(
    `/invoice/${payload.id}`,
    payload,
  );
  return response.data.data;
};

export const deleteInvoice = async (payload: DeleteInvoicePayload): Promise<void> => {
  await api.delete(`/invoice/${payload.id}`);
};
