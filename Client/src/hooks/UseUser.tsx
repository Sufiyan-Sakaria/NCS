// hooks/UseUser.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser } from "@/services/user"; // <- note `getUsers`
import { User } from "@/types/User";
import { CreateUserPayload } from "@/services/user";

export const useUserQuery = () => {
  return useQuery<User[]>({
    queryKey: ["users"], // <-- plural
    queryFn: getUsers,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, CreateUserPayload>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
