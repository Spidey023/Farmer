import { NavLink } from "react-router-dom";

const MainNavigationController = () => {
  return (
    <>
      <nav className="text-blue-500 p-2 border-gray-200 flex  justify-between items-center cursor-pointer">
        <ul className="Logo">
          <li>logo</li>
        </ul>
        <ul className="flex space-x-4 justify-end ">
          <li>
            {" "}
            <NavLink to="/profile">Profile</NavLink>
          </li>
          <li>
            {" "}
            <NavLink to="/login">Login</NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default MainNavigationController;
