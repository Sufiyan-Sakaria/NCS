import api from "@/lib/axios";
import { AxiosResponse } from "axios";

interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
  };
  branches?: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  message?: string;
}

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response: AxiosResponse<AuthResponse> = await api.post(
    "/auth/login",
    credentials
  );
  return response.data;
};

export const verify = async (): Promise<AuthResponse> => {
  const response: AxiosResponse<AuthResponse> = await api.get("/auth/verify", {
    withCredentials: true,
  });
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout", {}, { withCredentials: true });
};
