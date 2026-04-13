import { Outlet } from "react-router-dom";
import TopNav from "./TopNav";
import SideNav from "./SideNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="flex">
        <SideNav />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
