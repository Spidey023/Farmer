import { useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/redux";
import type { AppDispatch } from "../store/redux";
import { fetchFarmer } from "../store/redux/farmerSlice";

const ProtectedRoute = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading } = useSelector((state: RootState) => state.farmer);
  const triedRefetch = useRef(false);

  // If we don't have Redux data (e.g., hard refresh) but cookie may exist,
  // try fetching once before redirecting to /login.
  useEffect(() => {
    if (!data && !loading && !triedRefetch.current) {
      triedRefetch.current = true;
      dispatch(fetchFarmer());
    }
  }, [data, loading, dispatch]);

  // ✅ wait for redux hydration / API
  if (loading) {
    return <div className="p-10">Loading...</div>;
  }

  // ❌ not authenticated (after we tried fetching once)
  if (!data && triedRefetch.current) return <Navigate to="/login" replace />;

  // ✅ authenticated
  return <Outlet />;
};

export default ProtectedRoute;
