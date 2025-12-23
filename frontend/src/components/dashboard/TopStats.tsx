import type { FarmerDashboard } from "../../types/type";

const TopStats = ({
  farmerData,
  totalOrders,
}: {
  farmerData: FarmerDashboard;
  totalOrders: number;
}) => {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome, {farmerData?.fullName}👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here’s an overview of your farm today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Fields Owned</p>

          <p className="text-2xl font-bold mt-1">
            {farmerData?.fields.length || 0}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Crops Growing</p>

          <p className="text-2xl font-bold mt-1">
            {farmerData?.fields.reduce(
              (sum, field) => sum + (field.crops?.length ?? 0),
              0
            ) ?? 0}
          </p>

          {/* Placeholder until dynamic data is integrated */}
          {/* <p className="text-2xl font-bold mt-1">5</p> */}
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Tasks Today</p>
          <p className="text-2xl font-bold mt-1">stats.tasksToday</p>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Orders Placed</p>

          <p className="text-2xl font-bold mt-1">{totalOrders || 0}</p>
        </div>
      </div>
    </>
  );
};

export default TopStats;
