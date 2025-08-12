import { getTradingAccount, getTrialBalance } from "@/services/account";
import { useQuery } from "@tanstack/react-query";

// ==================== GET ====================

export const useTrailBalance = (branchId: string | null, financialYearId: string | null) =>
  useQuery({
    queryKey: ["trail-balance", branchId, financialYearId],
    queryFn: () => getTrialBalance(branchId!, financialYearId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });

export const useTradingAc = (branchId: string | null, financialYearId: string | null) =>
  useQuery({
    queryKey: ["trading-ac", branchId, financialYearId],
    queryFn: () => getTradingAccount(branchId!, financialYearId!),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 mins
    refetchInterval: 9 * 60 * 1000, // 9 mins
  });
