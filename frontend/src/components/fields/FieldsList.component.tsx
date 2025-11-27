import { NavLink } from "react-router-dom";
import { useFarmerContext } from "../../custom-hooks/useFarmerContext";
import Card from "../../ui/Card";

const FieldsListComponent = () => {
  const { farmerData, error } = useFarmerContext();
  console.log(farmerData);

  if (error) throw new Error("something went wrgn");
  return (
    <div className="fields-list-container px-4 sm:px-6 md:px-8 lg:px-10 py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Fields List Page</h1>
      <div className="fields-list flex flex-row gap-4">
        {farmerData?.fields.map((field, i) => {
          console.log(field.landImage);

          return (
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-xl">
              <NavLink to={`/fields/${field.fieldId}`}>
                <Card
                  fieldNumber={i + 1}
                  landType={field.landType}
                  cropGrowing={field.crops}
                  imageUrl={field.landImage}
                />
              </NavLink>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FieldsListComponent;
