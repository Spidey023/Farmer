import Card from "../../ui/Card";

const TodayTaskComponent = ({ crops }: { crops: Crop[] }) => {
  return (
    <Card className="h-full">
      <h2 className="font-semibold mb-2 text-gray-900">Today&apos;s Tasks</h2>
      <ul className="text-sm text-gray-700 space-y-2">
        <li>Irrigate Field 2 (Wheat)</li>
        <li>Apply fertilizer on Field 1 (Rice)</li>
        <li>Check pests in Field 3 (Tomato)</li>
      </ul>
    </Card>
  );
};

export default TodayTaskComponent;
