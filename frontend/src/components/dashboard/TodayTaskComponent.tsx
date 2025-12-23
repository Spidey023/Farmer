import type { Crop } from "../../types/type";

const TodayTaskComponent = ({ crops }: { crops: Crop[] }) => {
  console.log(crops);

  return (
    <>
      <div className="bg-white shadow rounded-lg p-4 lg:col-span-1">
        <h2 className="font-semibold mb-2">Today&apos;s Tasks</h2>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>Irrigate Field 2 (Wheat)</li>
          <li>Apply fertilizer on Field 1 (Rice)</li>
          <li>Check pests in Field 3 (Tomato)</li>
        </ul>
      </div>
    </>
  );
};
export default TodayTaskComponent;
