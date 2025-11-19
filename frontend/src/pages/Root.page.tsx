import { Outlet } from "react-router-dom";

import MainNavigationController from "../components/MainNavigation.controller";

const Rootpage = () => {
  return (
    <>
      <MainNavigationController />
      <Outlet />
    </>
  );
};

export default Rootpage;
