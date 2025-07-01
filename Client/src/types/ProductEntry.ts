// types/ProductEntry.ts

export interface ProductEntry {
  id: string;
  productId: string;
  godownId: string;
  productLedgerId: string;
  type: "IN" | "OUT";
  qty: number;
  thaan: number;
  date: string;
  runningQty?: number;
  runningThaan?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Relations
  product: {
    id: string;
    name: string;
    code?: string;
    hsn?: string;
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

export interface ProductStockSummary {
  qty: number;
  thaan: number;
}

export interface ProductEntriesFilters {
  productId?: string;
  from?: string;
  to?: string;
  godownId?: string;
  type?: "IN" | "OUT";
}
