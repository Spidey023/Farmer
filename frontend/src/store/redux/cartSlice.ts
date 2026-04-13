import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

export type CartStatus = "ACTIVE" | "CHECKED_OUT";

export type CartItem = {
  cartItemId: string;
  cartId: string;
  productId: string;
  qty: number;
  unitPrice: string; // backend returns Decimal as string
  fieldId?: string | null;
  createdAt: string;
  updatedAt: string;
  // optional include
  product?: { productId: string; name: string; price: string };
};

export type Cart = {
  cartId: string;
  farmerId: string;
  status: CartStatus;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
};

type CartState = {
  data: Cart | null;
  loading: boolean;
  error: string | null;
};

const initialState: CartState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchActiveCart = createAsyncThunk("cart/fetchActive", async () => {
  // Backend route is /cart/view-cart
  const res = await api.get("/cart/view-cart");
  return res.data.data as Cart;
});

export const addToCart = createAsyncThunk(
  "cart/add",
  async (payload: { productId: string; quantity: number }) => {
    await api.post("/cart/add-to-cart", payload);
    const res = await api.get("/cart/view-cart");
    return res.data.data as Cart;
  }
);

export const updateCartItemQty = createAsyncThunk(
  "cart/update",
  async (payload: { productId: string; quantity: number }) => {
    await api.patch("/cart/update-cart", payload);
    const res = await api.get("/cart/view-cart");
    return res.data.data as Cart;
  }
);

export const removeCartItem = createAsyncThunk(
  "cart/remove",
  async (productId: string) => {
    await api.delete(`/cart/remove/${productId}`);
    const res = await api.get("/cart/view-cart");
    return res.data.data as Cart;
  }
);

export const clearCart = createAsyncThunk("cart/clear", async () => {
  // Backend route is /cart/delete-cart
  await api.delete("/cart/delete-cart");
  return null;
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCart(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveCart.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActiveCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load cart";
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(updateCartItemQty.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
