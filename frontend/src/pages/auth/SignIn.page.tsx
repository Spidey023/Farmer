import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Card from "../../ui/Card";
import { api } from "../../lib/api";
import { fetchFarmer } from "../../store/redux/farmerSlice";
import type { AppDispatch } from "../../store/redux";

const SignInPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"FARMER" | "ADMIN">("FARMER");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);

      const payload = {
        email: String(fd.get("email") || "").trim(),
        password: String(fd.get("password") || ""),
      };

      // ✅ 1. Role-specific login (sets httpOnly cookie)
      const loginPath = loginMode === "ADMIN" ? "/auth/login/admin" : "/auth/login/farmer";
      await api.post(loginPath, payload);

      // ✅ 2. Fetch dashboard into Redux (await, to avoid ProtectedRoute redirect flicker)
      const dash = await dispatch(fetchFarmer()).unwrap();

      // ✅ 3. Redirect based on role
      const role = (dash as any)?.role;
      if (loginMode === "ADMIN") {
        if (role !== "ADMIN") throw new Error("NOT_ADMIN");
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch {
      setError(
        loginMode === "ADMIN"
          ? "Admin login failed. Check credentials or role."
          : "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Sign In</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back. Please sign in to continue.
          </p>
        </div>

        <Card>
          {/* Login mode switch */}
          <div className="mb-4 flex rounded-xl border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setLoginMode("FARMER")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                loginMode === "FARMER"
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Farmer Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("ADMIN")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                loginMode === "ADMIN"
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-sm text-gray-600 text-center">
              Don&apos;t have an account?{" "}
              <NavLink
                to="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Create one
              </NavLink>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignInPage;
