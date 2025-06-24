import api from "@/lib/axios";
import { User } from "@/types/User";
import { AxiosResponse } from "axios";

// ----------------------------
// GET
// ----------------------------
export const getUsersByCompany = async (companyId: string) => {
  const response: AxiosResponse<{ data: User[] }> = await api.get(`/user/company/${companyId}`);
  return response.data.data;
};

// ----------------------------
// CREATE
// ----------------------------
export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
  companyId: string;
  branchIds?: string[];
  createdBy: string;
};

export const createUser = async (data: CreateUserPayload): Promise<User> => {
  const response: AxiosResponse<{ data: User }> = await api.post("/user", data);
  return response.data.data;
};

// ----------------------------
// UPDATE
// ----------------------------
export type UpdateUserPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  updatedBy: string;
};

export const updateUser = async (data: UpdateUserPayload): Promise<User> => {
  const response: AxiosResponse<{ data: User }> = await api.patch(`/user/${data.id}`, data);
  return response.data.data;
};

// ----------------------------
// DELETE
// ----------------------------
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/user/${id}`);
};
