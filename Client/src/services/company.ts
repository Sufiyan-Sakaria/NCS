import api from "@/lib/axios";
import { Branch } from "@/types/Branch";
import { Company } from "@/types/Company";
import { User } from "@/types/User";
import { AxiosResponse } from "axios";

export interface CreateCompanyPayload {
  name: string;
  email: string;
  financialYearStart: Date;
  financialYearEnd: Date;
  branchName: string;
  branchAddress: string;
  userName: string;
  userEmail: string;
  userPassword: string;
}

export interface UpdateCompanyPayload {
  id: string;
  name?: string;
  email?: string;
}

export interface DeleteCompanyPayload {
  id: string;
}

export interface CreateCompanyResponse {
  user: User;
  branches: Branch[]; // or type this more precisely
}

// GET /company
export const getAllCompanies = async (): Promise<Company[]> => {
  const response: AxiosResponse<{ data: Company[] }> = await api.get("/company");
  return response.data.data;
};

// GET /company/:id
export const getCompanyById = async (id: string): Promise<Company> => {
  const response: AxiosResponse<{ data: Company }> = await api.get(`/company/${id}`);
  return response.data.data;
};

// POST /company
export const createCompany = async (
  payload: CreateCompanyPayload,
): Promise<CreateCompanyResponse> => {
  const response: AxiosResponse<{ data: CreateCompanyResponse }> = await api.post(
    "/company",
    payload,
  );
  return response.data.data;
};

// PATCH /company/:id
export const updateCompany = async (payload: UpdateCompanyPayload): Promise<Company> => {
  const response: AxiosResponse<{ data: Company }> = await api.patch(
    `/company/${payload.id}`,
    payload,
  );
  return response.data.data;
};

// DELETE /company/:id
export const deleteCompany = async (payload: DeleteCompanyPayload): Promise<void> => {
  await api.delete(`/company/${payload.id}`);
};
