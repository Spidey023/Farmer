import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const statuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setSavingId(orderId);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status });
      const updated = res.data?.data ?? res.data;
      setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders (Admin)</h1>
        <button
          onClick={fetchOrders}
          className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="mt-6">Loading...</div>}
      {error && <div className="mt-6 text-red-600">{error}</div>}

      <div className="mt-6 space-y-3">
        {orders.map((o: any) => (
          <div key={o.orderId} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-semibold">Order #{o.orderId}</div>
                <div className="text-sm text-gray-600">
                  Farmer: {o.farmer?.fullName ?? o.farmer?.username ?? "-"} ({o.farmer?.email ?? "-"})
                </div>
                <div className="text-sm text-gray-600">
                  Total: ₹{String(o.total)} • Placed:{" "}
                  {o.placedAt ? new Date(o.placedAt).toLocaleString() : "-"}
                </div>
                <div className="mt-2 text-sm">
                  Items: {Array.isArray(o.items) ? o.items.length : 0}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium mb-2">Status</div>
                <select
                  value={o.status}
                  disabled={savingId === o.orderId}
                  onChange={(e) => updateStatus(o.orderId, e.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {savingId === o.orderId && (
                  <div className="text-xs text-gray-500 mt-1">Saving...</div>
                )}
              </div>
            </div>

            {Array.isArray(o.items) && o.items.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1">Product</th>
                      <th className="py-1">Qty</th>
                      <th className="py-1">Unit Price</th>
                      <th className="py-1">Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it: any) => (
                      <tr key={it.orderItemId} className="border-t">
                        <td className="py-2">{it.product?.name ?? it.productId}</td>
                        <td className="py-2">{it.qty}</td>
                        <td className="py-2">₹{String(it.unitPrice)}</td>
                        <td className="py-2">
                          {it.field?.surveyNumber ?? it.fieldId ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {!loading && orders.length === 0 && (
          <div className="text-gray-600">No orders yet.</div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
