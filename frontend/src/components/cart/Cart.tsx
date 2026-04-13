import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/redux";
import type { AppDispatch } from "../../store/redux";
import { api } from "../../lib/api";
import { fetchFarmer } from "../../store/redux/farmerSlice";
import Info from "../../ui/Info";
import { useState } from "react";

const Cart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const farmerData = useSelector((state: RootState) => state.farmer.data);
  const [checkoutErr, setCheckoutErr] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "UPI" | "WALLET" | "NETBANKING"
  >("UPI");

  if (!farmerData) {
    return <p className="p-10">Loading cart...</p>;
  }

  const activeCart =
    farmerData.carts?.find((c) => c.status === "ACTIVE") ?? null;

  const items = activeCart?.items ?? [];

  const onRemove = async (productId: string) => {
    await api.delete(`/cart/remove/${productId}`);
    await dispatch(fetchFarmer());
  };

  const onCheckout = async () => {
    if (!activeCart) return;
    setCheckoutErr("");
    try {
      // Backend route is /orders/create-order
      await api.post("/orders/create-order", {
        cartId: activeCart.cartId,
        paymentMethod,
      });
      await dispatch(fetchFarmer());
      navigate("/orders");
    } catch (e: any) {
      setCheckoutErr(e?.response?.data?.message ?? "Failed to create order");
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.qty,
    0
  );

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review items before checkout
        </p>
        {checkoutErr ? (
          <p className="text-sm text-red-600 mt-2">{checkoutErr}</p>
        ) : null}
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="mt-10 text-center border rounded-2xl p-10 bg-gray-50">
          <p className="text-gray-500">Your cart is empty.</p>
        </div>
      )}

      {/* Cart Content */}
      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.cartItemId}
                className="rounded-2xl border bg-white p-4 flex gap-4"
              >
                {/* Image placeholder */}
                <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Product
                </div>

                {/* Details */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.product?.name ?? "Product"}
                  </p>

                  <div className="flex gap-4 mt-2">
                    <Info label="Price" value={`₹${item.unitPrice}`} />
                    <Info label="Qty" value={item.qty} />
                  </div>
                </div>

                {/* Price + Remove */}
                <div className="flex flex-col justify-between items-end">
                  <p className="font-semibold text-gray-900">
                    ₹{Number(item.unitPrice) * item.qty}
                  </p>

                  <button
                    onClick={() => onRemove(item.productId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border bg-white p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{subtotal}</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide text-gray-500">Payment Method</p>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="NETBANKING">Net Banking</option>
                <option value="CASH">Cash</option>
                <option value="WALLET">Wallet</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Wallet is a placeholder mode (no real payment gateway yet).
              </p>
            </div>

            <button
              onClick={onCheckout}
              className="mt-6 w-full rounded-xl bg-green-600 py-3 text-white font-medium hover:bg-green-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
