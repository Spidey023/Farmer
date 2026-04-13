import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../../lib/api";
import Card from "../../ui/Card";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fd = new FormData(e.currentTarget);

      const payload = {
        username: String(fd.get("username")),
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      };

      // Backend route is /auth/register
      await api.post("/auth/register", payload);

      navigate("/login");
    } catch {
      setError("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Join and manage your farm from one place.
          </p>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                User Name
              </label>
              <input
                name="username"
                required
                placeholder="Your username"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="min 6 characters"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="repeat password"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <p className="text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <NavLink
                to="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </NavLink>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
