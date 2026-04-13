type Crop = { name: string };

type Props = {
  fieldNumber: number;
  landType: string;
  cropGrowing?: Crop[] | null;
  imageUrl?: string | null;
};

const FieldCard = ({ fieldNumber, landType, cropGrowing, imageUrl }: Props) => {
  return (
    <div className="h-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={landType}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-500">
          No Image
        </div>
      )}

      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500">Field #{fieldNumber}</p>

        <h3 className="text-lg font-semibold text-gray-900">{landType}</h3>

        <p className="text-sm text-gray-600">
          Crop: {cropGrowing?.[0]?.name ?? "—"}
        </p>
      </div>
    </div>
  );
};

export default FieldCard;
