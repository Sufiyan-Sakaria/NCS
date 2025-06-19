import api from "@/lib/axios";
import { User } from "@/types/User";
import { AxiosResponse } from "axios";

export const getUsers = async () => {
  const response: AxiosResponse = await api.get("/user");
  return response.data.data;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  role: string;
  branchIds?: string[];
  createdBy: string;
};

export const createUser = async (data: CreateUserPayload): Promise<User> => {
  const response: AxiosResponse<{ data: User }> = await api.post("/user", data);
  return response.data.data;
};
