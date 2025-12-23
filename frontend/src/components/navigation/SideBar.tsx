import { NavLink } from "react-router-dom";

const SideBar = () => {
  return (
    <>
      <nav className="w-40 text-blue-500">
        <ul className="flex flex-col gap-3 m-5 items-start">
          <li>
            <NavLink to="/">DashBaord</NavLink>{" "}
          </li>
          <li>
            <NavLink to="/fields/fields-list">Fields</NavLink>{" "}
          </li>
          <li>
            <NavLink to="/">Orders</NavLink>{" "}
          </li>
          <li>
            <NavLink to="/">Lease</NavLink>{" "}
          </li>
          <li>
            <NavLink to="/products">Products</NavLink>
          </li>
          <li>
            {" "}
            <NavLink to="/cart">Cart</NavLink>{" "}
          </li>
        </ul>
      </nav>
    </>
  );
};

export default SideBar;
