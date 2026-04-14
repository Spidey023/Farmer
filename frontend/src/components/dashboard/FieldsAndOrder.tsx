import { NavLink } from "react-router-dom";
import type { Field, Order } from "../../types/type";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";

const FieldsAndOrder = ({
  fields,
  orders,
}: {
  fields: Field[];
  orders: Order[];
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <Card className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Your Fields</h2>
          <NavLink
            className="text-xs text-blue-600 hover:underline"
            to="/fields/fields-list"
          >
            View all
          </NavLink>
        </div>

        <ul className="text-sm text-gray-700 space-y-3">
          {fields && fields.length > 0 ? (
            fields.map((field, i) => (
              <li
                key={field.fieldId}
                className="flex items-center justify-between"
              >
                <NavLink
                  className="hover:underline"
                  to={`/fields/${field.fieldId}`}
                >
                  Field {i + 1} #{field.fieldId.slice(-4)}
                </NavLink>
                <Badge>Healthy</Badge>
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No fields found</p>
          )}
        </ul>
      </Card>

      <Card className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <button className="text-xs text-blue-600 hover:underline">
            View all
          </button>
        </div>

        <ul className="text-sm text-gray-700 space-y-3">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <li
                key={order.orderId}
                className="flex items-center justify-between"
              >
                <span>Order #{order.orderId.slice(-4)}</span>

                {/* keep your logic, but make style consistent */}
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    order.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "DELIVERED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </span>
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No orders found</p>
          )}
        </ul>
      </Card>
    </div>
  );
};

export default FieldsAndOrder;
