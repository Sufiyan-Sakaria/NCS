import { User } from "@/types/User";
import { Branch } from "@/types/Branch";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  selectedBranchId: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  selectedBranchId: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
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

export const {
  setUser,
  clearUser,
  setSelectedBranch,
  addBranch,
} = authSlice.actions;

export default authSlice.reducer;
