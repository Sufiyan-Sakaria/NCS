import api from "@/lib/axios";
import { AxiosResponse } from "axios";

export const getUser = async () => {
  const response: AxiosResponse = await api.get("/user");
  return response.data.data;
};
