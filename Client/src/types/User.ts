import { Branch } from "./Branch";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  branches: Branch[];
  createdAt: Date;
  updatedAt: Date;
};
