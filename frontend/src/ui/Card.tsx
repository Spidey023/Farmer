import type { Crop } from "../types/type";

type CardData = {
  fieldNumber: number;
  landType: string;
  cropGrowing: Crop[];
  imageUrl: string | null;
};
const Card = ({ fieldNumber, landType, cropGrowing, imageUrl }: CardData) => {
  const url = imageUrl ?? "Placeholder";
  return (
    <>
      <div className="md:flex">
        <div className="md:flex-shrink-0">
          <img
            className="h-48 w-full object-cover md:w-48"
            src={url}
            alt={landType}
          ></img>
        </div>
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            Field-{fieldNumber}
          </div>
          <p className="block mt-1 text-lg leading-tight font-medium text-black">
            {landType}
          </p>
          <p className="mt-2 text-gray-500">
            {cropGrowing?.length > 0
              ? cropGrowing.map((crop) => crop.name).join(", ")
              : "No crops growing"}
          </p>
        </div>
      </div>
    </>
  );
};

export default Card;
