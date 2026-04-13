import Info from "../../ui/Info";

type Snapshot = {
  createdAt?: string | null;
  at?: string | null;

  soilMoisture?: number | null;
  avgMoisture?: number | null;

  soilPH?: number | null;
  lastPh?: number | null;

  soilTemp?: number | null;

  nitrogenLevel?: number | null;
  phosphorusLevel?: number | null;
  potassiumLevel?: number | null;

  notes?: string | null;
  quality?: string | null;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const formatDateOnly = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const SnapshotComponent = ({
  heading,
  snapshot,
}: {
  heading: string;
  snapshot?: Snapshot | null;
}) => {
  return (
    <div className="relative rounded-2xl border bg-white p-6 min-w-80">
      {/* created date badge */}
      <span className="absolute top-3 right-4 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
        {formatDateOnly(snapshot?.createdAt)}
      </span>

      <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
        {heading}
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <Info
          label="Soil Moisture"
          value={formatValue(snapshot?.soilMoisture)}
        />
        <Info label="Avg Moisture" value={formatValue(snapshot?.avgMoisture)} />
        <Info label="Soil pH" value={formatValue(snapshot?.soilPH)} />
        <Info label="Soil Temp" value={formatValue(snapshot?.soilTemp)} />
        <Info label="Nitrogen" value={formatValue(snapshot?.nitrogenLevel)} />
        <Info
          label="Phosphorus"
          value={formatValue(snapshot?.phosphorusLevel)}
        />
        <Info label="Potassium" value={formatValue(snapshot?.potassiumLevel)} />
        <Info label="Quality" value={formatValue(snapshot?.quality)} />
      </div>
    </div>
  );
};

export default SnapshotComponent;
