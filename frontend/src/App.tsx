import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch } from "react-redux";
import router from "./routes/route";
import { fetchFarmer } from "./store/redux/farmerSlice";
import type { AppDispatch } from "./store/redux";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchFarmer());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;
