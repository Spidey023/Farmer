import { useContext } from "react";
import { FarmerContext } from "../store/context/FarmerContext";

export const useFarmerContext = () => {
  const ctx = useContext(FarmerContext);
  if (!ctx) {
    throw new Error(
      "useFarmerContext must be used within FarmerContextProvider"
    );
  }
  return ctx;
};
