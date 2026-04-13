import { useSelector } from "react-redux";
import type { RootState } from "../../store/redux";
import FieldsAndOrder from "./FieldsAndOrder";
import TopStats from "./TopStats";
import WeatherComponent from "./WeatherData";
import TodayTasks from "./TodayTasks";

const DashBoardComponent: React.FC = () => {
  const {
    data: farmerData,
    loading,
    error,
  } = useSelector((state: RootState) => state.farmer);

  if (loading) {
    return <p className="text-gray-500">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!farmerData) {
    return <p className="text-gray-500">No data available</p>;
  }

  const totalOrders = farmerData.orders.length;
  const crops = farmerData.fields.flatMap((field) => field.crops || []);

  return (
    <div className="space-y-6">
      <TopStats farmerData={farmerData} totalOrders={totalOrders} />

      <TodayTasks fields={farmerData.fields as any} />

      <WeatherComponent crops={crops} />

      <FieldsAndOrder
        fields={farmerData.fields.slice(0, 5)}
        orders={farmerData.orders.slice(0, 5)}
      />
    </div>
  );
};

export default DashBoardComponent;
