import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { User } from "@/types/User";

export const useActiveBranchId = (): string | null => {
  const { user, selectedBranchId } = useSelector((state: RootState) => state.auth);

  // Return selectedBranchId if set, otherwise default to first available
  return selectedBranchId || user?.branches?.[0]?.id || null;
};

export const useActiveCompanyId = (): string | null => {
  const { user } = useSelector((state: RootState) => state.auth);

  return user?.companyId || null;
};

export const useActiveUser = (): User | null => {
  const { user } = useSelector((state: RootState) => state.auth);

  return user;
};

export const useActiveGST = (): number | null => {
  const { gstPercent } = useSelector((state: RootState) => state.auth);

  return gstPercent;
};
