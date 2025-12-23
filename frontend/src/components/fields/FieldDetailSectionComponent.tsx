import Info from "../../ui/Info";

const FieldDetailSectionComponent = ({
  landType,
  soilType,
  reagion,
  createdAt,
}: {
  landType: string;
  soilType: string;
  reagion: string;
  createdAt: string;
}) => {
  return (
    <>
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Field Details
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Info label="Land Type" value={landType} />
          <Info label="Soil Type" value={soilType} />
          <Info label="Region" value={reagion} />
          <Info label="Created On" value={createdAt} />
        </div>
      </div>
    </>
  );
};

export default FieldDetailSectionComponent;
