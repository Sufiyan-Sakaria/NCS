import { Branch } from "./Branch";
import { FinancialYear } from "./FinancialYear";
import { User } from "./User";

export interface Company {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  branches?: Branch[];
  financialYears?: FinancialYear[];
  users?: User[];
}
