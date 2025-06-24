import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  getUsersByCompany,
  updateUser,
  UpdateUserPayload,
  CreateUserPayload,
} from "@/services/user";
import { User } from "@/types/User";

// Get all users for a company
export const useUserQuery = (companyId: string) => {
  return useQuery<User[]>({
    queryKey: ["users", companyId],
    queryFn: () => getUsersByCompany(companyId),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!companyId,
  });
};

// Create a new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, CreateUserPayload>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Delete a user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Update an existing user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, UpdateUserPayload>({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
