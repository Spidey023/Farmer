import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import farmerReducer from "./farmerSlice";
import cartReducer from "./cartSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  farmer: farmerReducer,
  cart: cartReducer,
});

export const persistedReducer = persistReducer(
  {
    key: "root",
    storage,
    whitelist: ["auth"], // 👈 persist login only
  },
  rootReducer
);

export default rootReducer;
