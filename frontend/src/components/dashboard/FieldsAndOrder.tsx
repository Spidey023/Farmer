import { NavLink } from "react-router-dom";
import type { Field, Order } from "./types/DashBaordTypes";

const FieldsAndOrder = ({
  fields,
  orders,
}: {
  fields: Field[];
  orders: Order[];
}) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FIELDS OVERVIEW */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Your Fields</h2>
            <button className="text-xs text-blue-600 hover:underline">
              <NavLink to="/fields/fields-list">View all fields from</NavLink>
            </button>
          </div>
          <ul className="text-sm text-gray-700 space-y-2">
            {fields.map((field, i) => (
              <li key={field.fieldId} className="flex justify-between">
                <span>
                  {" "}
                  <NavLink to={`/fields/${field.fieldId}`}>
                    Field {i + 1} #{field.fieldId.slice(-4)}
                  </NavLink>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                  Healthy
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* RECENT ORDERS / CARTS */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Recent Orders</h2>
            <button className="text-xs text-blue-600 hover:underline">
              View all orders
            </button>
          </div>
          <ul className="text-sm text-gray-700 space-y-2">
            {orders.map((order) => (
              <li key={order.orderId} className="flex justify-between">
                <span>Order #{order.orderId.slice(-4)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    order.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default FieldsAndOrder;
