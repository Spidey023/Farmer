import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import Card from "../../ui/Card";
import Info from "../../ui/Info";
import type { Order } from "../../types/type";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!orderId) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.data);
      } catch (e) {
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [orderId]);

  if (loading) return <p className="p-10">Loading...</p>;
  if (error) return <p className="p-10 text-red-600">{error}</p>;
  if (!order) return <p className="p-10">Order not found</p>;

  const totalItems = order.items?.reduce((s, it) => s + it.qty, 0) ?? 0;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <p className="text-sm text-gray-600 mt-1">#{order.orderId}</p>
      </div>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Info label="Status" value={order.status} />
          <Info label="Payment" value={order.paymentStatus} />
          <Info
            label="Placed On"
            value={new Date(order.placedAt).toDateString()}
          />
          <Info label="Items" value={totalItems} />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
        <div className="space-y-4">
          {order.items.map((it) => (
            <div
              key={it.orderItemId}
              className="flex items-center justify-between border rounded-xl p-4"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {it.product?.name ?? "Product"}
                </p>
                <p className="text-sm text-gray-600">
                  Qty: {it.qty} · Unit: ₹{it.unitPrice}
                </p>
              </div>
              <div className="font-semibold">₹{Number(it.unitPrice) * it.qty}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold">₹{order.total}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrderDetailPage;
