import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/redux";
import type { AppDispatch } from "../../store/redux";
import { api } from "../../lib/api";
import { clearFarmer, setAuthenticated } from "../../store/redux/farmerSlice";
import { persistor } from "../../store/redux";
import Info from "../../ui/Info";

const Profile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const farmerData = useSelector((state: RootState) => state.farmer.data);
  const loading = useSelector((state: RootState) => state.farmer.loading);

  const [editing, setEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  const [saveOk, setSaveOk] = useState<string>("");

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phoneNumber: "",
    address: "",
  });

  useEffect(() => {
    if (!farmerData) return;
    setForm({
      fullName: farmerData.fullName ?? "",
      username: farmerData.username ?? "",
      phoneNumber: farmerData.phoneNumber ?? "",
      address: farmerData.address ?? "",
    });
  }, [farmerData]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">Loading profile...</div>
    );
  }

  if (!farmerData) {
    return (
      <div className="p-10 text-center text-red-500">Profile not found</div>
    );
  }

  const { fullName, username, email, phoneNumber, address } = farmerData;
  const wallet = (farmerData as any)?.wallet;

  const onChange = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
    };

  const onSave = async () => {
    setSaveError("");
    setSaveOk("");
    setSaveLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim() || null,
      };

      await api.patch("/farmer/update-farmer", payload);
      setSaveOk("Profile updated");
      setEditing(false);
      // refresh redux profile
      await dispatch<any>(fetchFarmer());
    } catch (e: any) {
      setSaveError(e?.response?.data?.message ?? e?.message ?? "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // even if logout fails, clear local state
    } finally {
      dispatch(clearFarmer());
      dispatch(setAuthenticated(false));
      await persistor.purge();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
          {fullName?.charAt(0)}
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500">Farmer Account</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Personal Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Info label="Full Name" value={fullName} />
            <Info label="Username" value={username} />
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Contact Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Info label="Email" value={email} />
            <Info label="Phone" value={phoneNumber} />
            <Info label="Address" value={address ?? "—"} />
          </div>
        </div>

        {/* Wallet */}
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Wallet</h3>
          <div className="grid grid-cols-2 gap-4">
            <Info label="Balance" value={wallet ? `₹${String(wallet.balance)}` : "—"} />
            <Info label="Recent Tx" value={wallet?.transactions?.length ?? 0} />
          </div>
          {wallet?.transactions?.length ? (
            <div className="mt-4 space-y-2">
              {wallet.transactions.slice(0, 5).map((t: any) => (
                <div key={t.txId} className="flex items-center justify-between text-sm text-gray-700">
                  <div className="font-medium">{t.type}</div>
                  <div>₹{String(t.amount)}</div>
                  <div className="text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No transactions yet.</p>
          )}
        </div>
      </div>

      {/* Edit Panel */}
      {editing ? (
        <div className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Edit Profile
          </h3>

          <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Full Name
              </label>
              <input
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Phone
              </label>
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            {saveError ? (
              <p className="text-sm text-red-600 md:col-span-2">{saveError}</p>
            ) : null}
            {saveOk ? (
              <p className="text-sm text-green-700 md:col-span-2">{saveOk}</p>
            ) : null}

            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saveLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => {
            setSaveError("");
            setSaveOk("");
            setEditing(true);
          }}
          className="rounded-xl border px-6 py-2 text-sm hover:bg-gray-50"
        >
          Edit Profile
        </button>

        <button
          onClick={onLogout}
          className="rounded-xl bg-red-600 px-6 py-2 text-sm text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
