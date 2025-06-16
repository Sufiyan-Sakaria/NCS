import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getUser,
    updateUser,
} from "@/lib/api/auth"

export const useUserQuery = () => {
    return useQuery({
        queryKey: ["user"],
        queryFn: getUser,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false,
    })
}

export const useUpdateUserMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] })
        },
    })
}
