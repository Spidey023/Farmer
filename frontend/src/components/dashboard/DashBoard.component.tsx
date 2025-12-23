import TopStats from "./TopStats";
import WeatherComponent from "./WeatherData";

import FieldsAndOrder from "./FieldsAndOrder";
import { useFarmerContext } from "../../custom-hooks/useFarmerContext";

const DashBoardComponent: React.FC = () => {
  const { farmerData, error } = useFarmerContext();

  // ❗ If error → show error
  if (error) return <p className="text-red-500">{error}</p>;

  // ❗ If still loading (null) → show loader instead of passing null
  if (!farmerData) return <p>Loading...</p>;

  // ❗ Now farmerData is 100% NOT NULL
  const totalOrders = farmerData.orders.length;

  const crops = farmerData.fields.flatMap((field) => field.crops || []);
  return (
    <>
      <div className="px-4 sm:px-3 md:px-4 lg:px-5 space-y-6">
        {/* HEADER */}
        {!error && (
          <TopStats farmerData={farmerData} totalOrders={totalOrders} />
        )}
        {/* WEATHER + TASKS */}
        <WeatherComponent crops={crops} />

        {/* FIELDS + ORDERS */}
        <FieldsAndOrder
          fields={farmerData.fields.slice(0, 5)}
          orders={farmerData.orders.slice(0, 5)}
        />
      </div>
    </>
  );
};

export default DashBoardComponent;
