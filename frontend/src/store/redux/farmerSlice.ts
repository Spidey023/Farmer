import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../lib/api";
import type { FarmerDashboard } from "../../types/type";

export const fetchFarmer = createAsyncThunk(
  "farmer/fetchFarmer",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/auth/dashboard");
      return response.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  },
);

type FarmerState = {
  data: FarmerDashboard | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
};

const initialState: FarmerState = {
  data: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const farmerSlice = createSlice({
  name: "farmer",
  initialState,
  reducers: {
    setFarmer(state, action: PayloadAction<FarmerDashboard | null>) {
      state.data = action.payload;
    },
    setAuthenticated(state, action: PayloadAction<boolean>) {
      state.isAuthenticated = action.payload;
      if (!action.payload) state.data = null;
    },
    clearFarmer(state) {
      state.data = null;
      state.error = null;
      state.loading = false;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFarmer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFarmer.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchFarmer.rejected, (state, action) => {
        state.loading = false;
        state.data = null;
        state.isAuthenticated = false;
        state.error = action.error.message ?? "Failed to load farmer data";
      });
  },
});

export const { clearFarmer, setAuthenticated, setFarmer } = farmerSlice.actions;
export default farmerSlice.reducer;
