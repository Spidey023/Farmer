type ProductCardProps = {
  name: string;
  category: string;
  price: number;
  unit?: string;
  image: string;
  onAddToCart?: () => void;
};

const ProductCard = ({
  name,
  category,
  price,
  unit = "unit",
  image,
  onAddToCart,
}: ProductCardProps) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
      {/* Image */}
      <div className="h-40 w-full overflow-hidden rounded-xl bg-gray-100 mb-4">
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </div>

      {/* Category */}
      <p className="text-xs uppercase tracking-wide text-gray-500">
        {category}
      </p>

      {/* Name */}
      <h3 className="text-lg font-semibold text-gray-900 mt-1">{name}</h3>

      {/* Price */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-lg font-bold text-green-700">
          ₹{price}
          <span className="text-sm font-normal text-gray-500">/{unit}</span>
        </p>

        <button
          onClick={onAddToCart}
          className="px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
