import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../../lib/api";
import type { Order, OrderStatus, PaymentStatus } from "../../types/type";
import Info from "../../ui/Info";

// Backend OrderStatus is: PENDING | PLACED | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
const statusStyle: Partial<Record<OrderStatus, string>> = {
  PENDING: "bg-gray-100 text-gray-700",
  PLACED: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const paymentStyle: Record<PaymentStatus, string> = {
  INITIATED: "text-yellow-600",
  PAID: "text-green-600",
  FAILED: "text-red-600",
  REFUNDED: "text-gray-600",
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/orders");
      setOrders(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Cancel this order?")) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await fetchOrders();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to cancel order");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track your purchases and delivery status
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {loading ? "Loading..." : error ? error : `Showing ${orders.length} order(s)`}
        </div>
        <button
          onClick={fetchOrders}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="mt-10 text-center border rounded-2xl p-10 bg-gray-50">
          <p className="text-gray-500">You haven’t placed any orders yet.</p>
        </div>
      )}

      {/* Orders List */}
      <div className="mt-6 space-y-5">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="rounded-2xl border bg-white p-6 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Order ID
                </p>
                <p className="font-medium text-gray-900">
                  #{order.orderId.slice(0, 8)}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusStyle[order.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <Info
                label="Placed On"
                value={new Date(order.placedAt).toDateString()}
              />
              <Info label="Items" value={order.items?.length ?? 0} />
              <Info label="Total" value={`₹${order.total}`} />
              <Info
                label="Payment"
                value={
                  <span className={paymentStyle[order.paymentStatus]}>
                    {order.paymentStatus}
                  </span>
                }
              />
            </div>

            <div className="mt-5 flex justify-end">
              <NavLink
                to={`/orders/${order.orderId}`}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >
                View Details
              </NavLink>

              {order.status === "PENDING" ? (
                <button
                  onClick={() => cancelOrder(order.orderId)}
                  className="ml-2 rounded-xl bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
