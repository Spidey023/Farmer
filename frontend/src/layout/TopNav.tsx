import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import { clearFarmer, setAuthenticated } from "../store/redux/farmerSlice";
import { api } from "../lib/api";
import { persistor } from "../store/redux";
import type { RootState } from "../store/redux";

const TopNav = () => {
  const dispatch = useDispatch();
  const farmer = useSelector((state: RootState) => state.farmer.data);

  const cartCount = (farmer?.carts?.find((c: any) => c.status === "ACTIVE")
    ?.items?.length ?? 0) as number;

  const logout = async () => {
    await api.post("/auth/logout");
    dispatch(clearFarmer());
    dispatch(setAuthenticated(false));
    persistor.purge();
  };

  return (
    <nav className="h-14 flex items-center justify-between px-6 border-b bg-white">
      <NavLink to="/" className="font-semibold text-green-700">
        Former
      </NavLink>

      {farmer ? (
        <div className="flex items-center gap-4">
          <NavLink
            to="/cart"
            className="relative rounded-xl border px-3 py-1 text-sm hover:bg-gray-50"
          >
            🛒 Cart
            {cartCount > 0 ? (
              <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                {cartCount}
              </span>
            ) : null}
          </NavLink>

          <span className="text-sm text-gray-700">{farmer.fullName}</span>

          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      ) : (
        <NavLink to="/login" className="text-sm text-blue-600">
          Login
        </NavLink>
      )}
    </nav>
  );
};

export default TopNav;
