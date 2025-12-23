import Info from "../../ui/Info";

const CropDetailComponent = ({ cropName, season, status, cropStatus }) => {
  return (
    <>
      <div className="rounded-2xl border bg-white p-6 ">
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Crop Details
        </h2>

        {cropName ? (
          <div className="grid grid-cols-2 gap-6">
            <Info label="Crop Name" value={cropName} />
            <Info label="Season" value={season} />
            <Info label="Status" value={status} />
            <Info label="Crop Status" value={cropStatus} />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No crop assigned</p>
        )}
      </div>
    </>
  );
};

export default CropDetailComponent;
