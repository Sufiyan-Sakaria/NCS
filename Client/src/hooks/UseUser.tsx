import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/services/user";

export const useUserQuery = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
