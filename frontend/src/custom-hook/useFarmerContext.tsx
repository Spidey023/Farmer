import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "../store/redux";
import { clearFarmer, fetchFarmer } from "../store/redux/farmerSlice";

/**
 * Compatibility hook.
 *
 * Your app originally used Context (`useFarmerContext`).
 * You are migrating to Redux + persist, but many components still import this hook.
 *
 * This wrapper keeps old imports working, while reading data from Redux.
 */
export const useFarmerContext = () => {
  const dispatch = useDispatch<AppDispatch>();
  const farmer = useSelector((state: RootState) => state.farmer);

  const refreshFarmer = useCallback(() => {
    return dispatch(fetchFarmer());
  }, [dispatch]);

  const logoutLocal = useCallback(() => {
    dispatch(clearFarmer());
  }, [dispatch]);

  return {
    farmerData: farmer.data,
    isLoading: farmer.loading,
    error: farmer.error,
    refreshFarmer,
    clearFarmer: logoutLocal,
  };
};

export default useFarmerContext;
