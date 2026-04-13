import { configureStore } from "@reduxjs/toolkit";
import farmerReducer from "./farmerSlice";
import cartReducer from "./cartSlice";
import productsReducer from "./productsSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["farmer"],
};

const persistedFarmerReducer = persistReducer(persistConfig, farmerReducer);

export const store = configureStore({
  reducer: {
    farmer: persistedFarmerReducer,
    cart: cartReducer,
    products: productsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
