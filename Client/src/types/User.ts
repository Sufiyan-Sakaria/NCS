import { Branch } from "./Branch";
import { Role } from "./Role";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  branches: Branch[];
  createdAt: Date;
  updatedAt: Date;
};
