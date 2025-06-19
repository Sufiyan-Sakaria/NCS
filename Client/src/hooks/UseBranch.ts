import { useQuery } from "@tanstack/react-query";
import { getBranches } from "@/services/branch";
import { Branch } from "@/types/Branch";

export const useBranches = () => {
  return useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: getBranches,
    staleTime: 1000 * 60 * 10, // 10 min
  });
};
