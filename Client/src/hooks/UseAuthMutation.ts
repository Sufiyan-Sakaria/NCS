import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { login, verify, logout, AuthResponse } from "@/services/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useLogin = (
  options?: UseMutationOptions<
    AuthResponse,
    Error,
    { email: string; password: string }
  >
) => {
  const router = useRouter();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Login successful");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
    ...options,
  });
};

export const useVerify = (
  options?: UseMutationOptions<AuthResponse, Error, void>
) => {
  return useMutation({
    mutationFn: verify,
    onError: (error) => {
      console.error("Verification error:", error);
    },
    ...options,
  });
};

export const useLogout = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.push("/auth/login");
    },
    onError: (error) => {
      toast.error(error.message || "Logout failed");
    },
  });
};
