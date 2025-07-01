import { useQuery } from "@tanstack/react-query";
import { getProductEntries } from "@/services/productEntries";

interface UseProductEntriesParams {
  productId?: string;
  from?: string;
  to?: string;
  godownId?: string;
  type?: "IN" | "OUT";
}

export const useProductEntries = (params: UseProductEntriesParams) => {
  return useQuery({
    queryKey: ["productEntries", params],
    queryFn: () => getProductEntries(params),
    enabled: !!params.productId,
    staleTime: 5 * 60 * 1000, // 5 mins
    refetchInterval: false, // Don't auto-refetch for historical data
  });
};
