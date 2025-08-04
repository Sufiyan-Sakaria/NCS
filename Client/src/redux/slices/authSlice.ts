import { User } from "@/types/User";
import { Branch } from "@/types/Branch";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  gstPercent: number;
  isAuthenticated: boolean;
  selectedBranchId: string | null;
}

const initialState: AuthState = {
  user: null,
  gstPercent: 0,
  isAuthenticated: false,
  selectedBranchId: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; gstPercent: number }>) => {
      state.user = action.payload.user;
      state.gstPercent = action.payload.gstPercent;
      state.isAuthenticated = true;
      state.selectedBranchId = action.payload.user.branches[0]?.id || null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.selectedBranchId = null;
    },
    setSelectedBranch: (state, action: PayloadAction<string>) => {
      state.selectedBranchId = action.payload;
    },
    addBranch: (state, action: PayloadAction<Branch>) => {
      if (state.user) {
        state.user.branches.push(action.payload);
      }
    },
  },
});

export const { setUser, clearUser, setSelectedBranch, addBranch } = authSlice.actions;

export default authSlice.reducer;
