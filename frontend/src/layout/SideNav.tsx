import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/redux";

const linkBase =
  "block rounded-xl px-3 py-2 text-sm transition hover:bg-gray-100";

const SideNav = () => {
  const role = useSelector((s: RootState) => s.farmer.data?.role);

  const farmerLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/fields/fields-list", label: "Fields" },
    { to: "/lease", label: "Lease" },
    { to: "/analytics", label: "Analytics" },
    { to: "/products", label: "Products" },
    { to: "/cart", label: "Cart" },
    { to: "/orders", label: "Orders" },
    { to: "/profile", label: "Profile" },
  ];

  const adminLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/admin", label: "Admin" },
    { to: "/admin/crops", label: "Crops (Admin)" },
    { to: "admin/seasons", label: "Seasons (Admin)" },
    { to: "/admin/products", label: "Products (Admin)" },
    { to: "/admin/leases", label: "Leases (Admin)" },
    { to: "/admin/orders", label: "Orders (Admin)" },
  ];

  const links = role === "ADMIN" ? adminLinks : farmerLinks;

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="p-4">
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
          Menu
        </h2>

        <div className="space-y-1">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-blue-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
