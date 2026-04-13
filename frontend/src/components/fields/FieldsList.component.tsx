import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "../../store/redux";
import FieldCard from "../../ui/FieldCard";

const FieldsListComponent = () => {
  const farmerData = useSelector((state: RootState) => state.farmer.data);
  const loading = useSelector((state: RootState) => state.farmer.loading);

  if (loading) return <p className="p-10">Loading...</p>;
  if (!farmerData) return <p className="p-10">No data found</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your Fields</h1>

        <NavLink
          to="/fields/create"
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Create Field
        </NavLink>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {farmerData.fields.map((field, idx) => (
          <NavLink
            key={field.fieldId}
            to={`/fields/${field.fieldId}`}
            className="block"
          >
            <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
              <FieldCard
                fieldNumber={idx + 1}
                landType={field.landType}
                cropGrowing={field.crops}
                imageUrl={field.landImage}
              />
            </div>
          </NavLink>
        ))}
      </div>

      <p className="text-sm text-gray-500">Total: {farmerData.fields.length}</p>
    </div>
  );
};

export default FieldsListComponent;
