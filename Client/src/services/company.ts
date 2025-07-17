import api from "@/lib/axios";
import { Company } from "@/types/Company";
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
export const createCompany = async (payload: CreateCompanyPayload): Promise<Company> => {
  const response: AxiosResponse<{ data: Company }> = await api.post("/company", payload);
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
