import { Outlet } from "react-router-dom";

import MainNavigationController from "../components/navigation/MainNavigation.controller";
import SideBar from "../components/navigation/SideBar";

const Rootpage = () => {
  return (
    <>
      <MainNavigationController />
      <div className="flex ">
        <SideBar />
        <main className="flex-1 w-fill">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Rootpage;
