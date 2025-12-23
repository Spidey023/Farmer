import { useParams } from "react-router-dom";
import { useFarmerContext } from "../../custom-hooks/useFarmerContext";
import FieldDetailSectionComponent from "./FieldDetailSectionComponent";
import CropDetailComponent from "./CropDetailComponent";

const FieldDetailComponent = () => {
  const { farmerData } = useFarmerContext();
  const { fieldId } = useParams();

  const field = farmerData?.fields?.find((f) => fieldId === f.fieldId);

  // handle loading / not found safely
  if (!farmerData) return <p className="p-10">Loading...</p>;
  if (!field) return <p className="p-10">Field not found</p>;

  const plan = field.fieldSeasonPlan?.[0]; // could be undefined

  console.log(plan?.season?.name);

  return (
    <div className="max-w-[950px] p-10 m-auto">
      <div className="image-container rounded-xl overflow-hidden">
        {field.landImage ? (
          <img
            className="h-64 w-full object-cover"
            src={field.landImage}
            alt={field.landType}
          />
        ) : (
          <p>{field.landType}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mt-8 mb-8">
        <FieldDetailSectionComponent
          landType={field.landType}
          soilType={field.soilType}
          reagion={field.region ?? "N/A"}
          createdAt={new Date(field.createdAt).toDateString()}
        />

        <CropDetailComponent
          cropName={field.crops?.[0]?.name ?? "—"}
          season={plan?.season?.name ?? "—"}
          status={plan?.status ?? "—"}
          cropStatus={plan?.cropStatus ?? "—"}
        />

        <div className="rounded-2xl border bg-gradient-to-r from-green-50 to-white p-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Lease Status
            </p>
            <p className="text-xl font-semibold text-green-700">Active Lease</p>
          </div>

          <span className="px-4 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};

export default FieldDetailComponent;
