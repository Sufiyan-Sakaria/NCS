import api from "@/lib/axios";
import { AxiosResponse } from "axios";

// ============ Types ============

export interface ProductEntry {
  id: string;
  productId: string;
  godownId: string;
  type: "IN" | "OUT";
  qty: number;
  thaan: number;
  date: string;
  runningQty: number;
  runningThaan: number;
  product: {
    id: string;
    name: string;
    code: string;
  };
  godown: {
    id: string;
    name: string;
  };
  createdByUser: {
    id: string;
    name: string;
  };
}

export interface ProductEntriesResponse {
  entries: ProductEntry[];
  totalEntries: number;
  summary: {
    totalIn: number;
    totalOut: number;
    currentStock: number;
  };
}

export interface ProductEntriesParams {
  productId?: string;
  from?: string;
  to?: string;
  godownId?: string;
  type?: "IN" | "OUT";
}

// ============ API Methods ============

// GET /product-ledger/product/:productId/entries
export const getProductEntries = async (
  params: ProductEntriesParams,
): Promise<ProductEntriesResponse> => {
  if (!params.productId) {
    throw new Error("Product ID is required");
  }

  const queryParams = new URLSearchParams();

  if (params.from) queryParams.append("from", params.from);
  if (params.to) queryParams.append("to", params.to);
  if (params.godownId) queryParams.append("godownId", params.godownId);
  if (params.type) queryParams.append("type", params.type);

  const queryString = queryParams.toString();
  const url = `/product-ledger/product/${params.productId}/entries${
    queryString ? `?${queryString}` : ""
  }`;

  const response: AxiosResponse<{ data: ProductEntriesResponse }> = await api.get(url);
  return response.data.data;
};

// GET /product-ledger/summary/:productId (for quick stock summary)
export const getProductStockSummary = async (
  productId: string,
): Promise<{ qty: number; thaan: number }> => {
  const response: AxiosResponse<{ data: { qty: number; thaan: number } }> = await api.get(
    `/product-ledger/summary/${productId}`,
  );
  return response.data.data;
};
