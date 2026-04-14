import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/redux";
import Card from "../../ui/Card";
import Info from "../../ui/Info";
import { api } from "../../lib/api";

type LeaseRow = {
  leaseId: string;
  fieldId: string;
  modelType: string;
  rentAmount: string;
  status: string;
  approvalStatus: string;
  createdAt: string;
  field: {
    surveyNumber: number;
    acres: string;
    farmer: { username: string; email: string };
  };
};

type DashboardStats = {
  totalFarmers: number;
  totalProducts: number;
  activeLeases: number;
  pendingLeases: number;
  totalOrders: number;
  revenue: any;
};

type OrderRow = {
  orderId: string;
  status: string;
  total: string;
  createdAt: string;
  farmer?: { username?: string; email?: string; fullName?: string };
};

const AdminPage = () => {
  const navigate = useNavigate();
  const role = useSelector((s: RootState) => (s.farmer.data as any)?.role);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const [topupFarmerId, setTopupFarmerId] = useState<string>("");
  const [topupAmount, setTopupAmount] = useState<string>("");

  const [farmerSearch, setFarmerSearch] = useState<string>("");
  const [farmerResults, setFarmerResults] = useState<any[]>([]);
  const [txSearch, setTxSearch] = useState<string>("");
  const [txs, setTxs] = useState<any[]>([]);

  const load = async () => {
    const dash = await api.get("/admin/dashboard");
    const payload = dash.data.data ?? dash.data;
    setStats(payload.stats ?? null);
    setLeases(payload.pendingLeases ?? []);
    setRecentOrders(payload.recentOrders ?? []);

    const txRes = await api.get("/admin/wallet/transactions");
    setTxs(txRes.data.data ?? []);
  };

  useEffect(() => {
    // Basic client-side guard. Server endpoints are also admin-protected.
    if (role && role !== "ADMIN") {
      navigate("/");
      return;
    }
    load().catch(() => {});
  }, [role, navigate]);

  const approve = async (leaseId: string) => {
    try {
      setBusy(leaseId);
      setErr("");
      setMsg("");
      await api.post(`/admin/leases/${leaseId}/approve`);
      setMsg("Lease approved");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to approve");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (leaseId: string) => {
    try {
      setBusy(leaseId);
      setErr("");
      setMsg("");
      await api.post(`/admin/leases/${leaseId}/reject`);
      setMsg("Lease rejected");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to reject");
    } finally {
      setBusy(null);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setErr("");
      setMsg("");
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setMsg("Order status updated");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to update order");
    }
  };

  const topup = async () => {
    try {
      setErr("");
      setMsg("");
      if (!topupFarmerId || !topupAmount)
        throw new Error("farmer identifier and amount required");
      const payload: any = { amount: topupAmount };
      if (topupFarmerId.includes("@")) payload.email = topupFarmerId;
      else payload.username = topupFarmerId;
      await api.post("/admin/wallet/topup", payload);
      setMsg("Wallet topped up");
      setTopupAmount("");
      const txRes = await api.get("/admin/wallet/transactions");
      setTxs(txRes.data.data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Topup failed");
    }
  };

  const searchFarmers = async (q: string) => {
    try {
      const res = await api.get(
        `/admin/farmers?query=${encodeURIComponent(q)}`,
      );
      setFarmerResults(res.data.data ?? []);
    } catch {
      setFarmerResults([]);
    }
  };

  const searchTransactions = async (q: string) => {
    try {
      const res = await api.get(
        `/admin/wallet/transactions?query=${encodeURIComponent(q)}`,
      );
      setTxs(res.data.data ?? []);
    } catch {
      setTxs([]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-600 mt-1">
          Platform overview • leases • orders • wallets
        </p>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card>
            <div className="text-xs text-gray-500">Farmers</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalFarmers ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Products</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalProducts ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Active Leases</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.activeLeases ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Pending Leases</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.pendingLeases ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Orders</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalOrders ?? 0}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-gray-500">Revenue</div>
            <div className="text-xl font-bold text-gray-900">
              ₹{String(stats.revenue ?? 0)}
            </div>
          </Card>
        </div>
      ) : null}

      {msg ? <Info label="success" value={msg} /> : null}
      {err ? <Info label="error" value={err} /> : null}

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Wallet Topup
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Search farmer by ID / username / email and top up wallet.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            className="rounded-xl border border-gray-200 bg-white px-3 py-2"
            placeholder="Search farmer (id/username/email)"
            value={farmerSearch}
            onChange={(e) => {
              const v = e.target.value;
              setFarmerSearch(v);
              searchFarmers(v);
            }}
          />
          <div className="md:col-span-2 text-xs text-gray-500 flex items-center">
            Tip: click a farmer from results to auto-fill.
          </div>
        </div>

        {farmerSearch && farmerResults.length ? (
          <div className="mb-4 max-h-48 overflow-auto rounded-xl border border-gray-200">
            {farmerResults.map((f) => (
              <button
                key={f.farmerId}
                type="button"
                onClick={() => {
                  setTopupFarmerId(f.email ?? f.username ?? f.farmerId);
                  setFarmerSearch("");
                  setFarmerResults([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              >
                <div className="font-semibold text-gray-900">
                  {f.fullName ?? f.username ?? "Farmer"}
                </div>
                <div className="text-xs text-gray-600">
                  {f.username} • {f.email} • {f.farmerId}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="rounded-xl border border-gray-200 bg-white px-3 py-2"
            placeholder="Farmer Email or Username"
            value={topupFarmerId}
            onChange={(e) => setTopupFarmerId(e.target.value)}
          />
          <input
            className="rounded-xl border border-gray-200 bg-white px-3 py-2"
            placeholder="Amount"
            type="number"
            step="0.01"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
          />
          <button
            onClick={topup}
            className="rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-semibold"
          >
            Topup
          </button>
        </div>
        {topupAmount ? (
          <p className="mt-2 text-sm text-gray-700">Amount: ₹{topupAmount}</p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Wallet Transactions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input
            className="rounded-xl border border-gray-200 bg-white px-3 py-2"
            placeholder="Filter transactions by farmer id/username/email"
            value={txSearch}
            onChange={(e) => {
              const v = e.target.value;
              setTxSearch(v);
              searchTransactions(v);
            }}
          />
          <div className="md:col-span-2 text-xs text-gray-500 flex items-center">
            Showing latest 100 transactions.
          </div>
        </div>

        {txs.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                  <th className="py-2 pr-4">Farmer</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Ref</th>
                  <th className="py-2 pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr
                    key={
                      t.txId ?? t.walletTxId ?? `${t.walletId}-${t.createdAt}`
                    }
                    className="border-b last:border-0"
                  >
                    <td className="py-2 pr-4">
                      <div className="font-medium text-gray-900">
                        {t.wallet?.farmer?.username ?? "—"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {t.wallet?.farmer?.email ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.wallet?.farmerId ?? "—"}
                      </div>
                    </td>
                    <td className="py-2 pr-4">{t.type}</td>
                    <td className="py-2 pr-4">₹{String(t.amount)}</td>
                    <td className="py-2 pr-4">{t.referenceType ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Pending Leases
        </h2>
        {leases.length === 0 ? (
          <p className="text-sm text-gray-500">No pending leases</p>
        ) : (
          <div className="space-y-3">
            {leases.map((l) => (
              <div
                key={l.leaseId}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">
                    Survey #{l.field?.surveyNumber} • {l.field?.acres} acres
                  </div>
                  <div className="text-gray-600">
                    {l.field?.farmer?.username} • {l.field?.farmer?.email}
                  </div>
                  <div className="text-gray-600">
                    Rent: {l.rentAmount} • Model: {l.modelType}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(l.leaseId)}
                    disabled={busy === l.leaseId}
                    className="rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {busy === l.leaseId ? "Working..." : "Approve"}
                  </button>
                  <button
                    onClick={() => reject(l.leaseId)}
                    disabled={busy === l.leaseId}
                    className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="text-sm font-semibold text-green-700"
          >
            View all
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Farmer</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Change</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.orderId} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-gray-900">
                        {o.orderId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="font-medium text-gray-900">
                        {o.farmer?.fullName ?? o.farmer?.username ?? "—"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {o.farmer?.email ?? "—"}
                      </div>
                    </td>
                    <td className="py-2 pr-4">₹{String(o.total)}</td>
                    <td className="py-2 pr-4">{o.status}</td>
                    <td className="py-2 pr-4">
                      <select
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2"
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) updateOrderStatus(o.orderId, v);
                          e.currentTarget.value = "";
                        }}
                      >
                        <option value="">Change</option>
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminPage;
