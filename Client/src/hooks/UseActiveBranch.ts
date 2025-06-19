import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export const useActiveBranchId = (): string | null => {
  const { user, selectedBranchId } = useSelector(
    (state: RootState) => state.auth
  );

  // Return selectedBranchId if set, otherwise default to first available
  return selectedBranchId || user?.branches?.[0]?.id || null;
};
