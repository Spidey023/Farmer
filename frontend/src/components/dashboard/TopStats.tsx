import type { DashboardData } from "../../types/type";
import Card from "../../ui/Card";

const TopStats = ({
  farmerData,
  totalOrders,
}: {
  farmerData: DashboardData;
  totalOrders: number;
}) => {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {farmerData.fullName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here’s an overview of your farm today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <p className="text-xs text-gray-500">Fields Owned</p>
          <p className="text-2xl font-bold mt-1">{farmerData.fields.length}</p>
        </Card>

        <Card>
          <p className="text-xs text-gray-500">Crops Growing</p>
          <p className="text-2xl font-bold mt-1">
            {farmerData.fields.reduce(
              (sum, field) => sum + (field.crops?.length ?? 0),
              0
            )}
          </p>
        </Card>

        <Card>
          <p className="text-xs text-gray-500">Tasks Today</p>
          <p className="text-2xl font-bold mt-1">—</p>
        </Card>

        <Card>
          <p className="text-xs text-gray-500">Orders Placed</p>
          <p className="text-2xl font-bold mt-1">{totalOrders}</p>
        </Card>
      </div>
    </>
  );
};

export default TopStats;
