import api from "@/lib/axios";
import { AxiosResponse } from "axios";

export interface CreateBranchPayload {
  name: string;
  address: string;
  companyId: string;
}

export const createBranch = async (payload: CreateBranchPayload) => {
  const response: AxiosResponse = await api.post("/branch", payload);
  return response.data.data;
};

export const getBranches = async () => {
  const response: AxiosResponse = await api.get("/branch");
  return response.data.data;
};
