import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store/redux";
import type { RootState } from "../../store/redux";
import { fetchProducts } from "../../store/redux/productsSlice";
import { api } from "../../lib/api";
import { fetchFarmer } from "../../store/redux/farmerSlice";
import type { Product } from "../../types/type";

const ProductCard = ({
  p,
  onAdd,
  adding,
}: {
  p: Product;
  onAdd: (productId: string) => void;
  adding: boolean;
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="h-40 w-full bg-gray-50 flex items-center justify-center text-gray-400">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm">No image</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
              {p.category ?? "GENERAL"}
            </p>
          </div>
          <p className="font-semibold text-gray-900">₹{p.price}</p>
        </div>

        {p.description ? (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{p.description}</p>
        ) : null}

        <button
          disabled={adding}
          onClick={() => onAdd(p.productId)}
          className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {adding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

const Product = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((s: RootState) => s.products);

  const [query, setQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const onAdd = async (productId: string) => {
    try {
      setAddingId(productId);
      await api.post("/cart/add-to-cart", { productId, quantity: 1 });
      // Refresh dashboard (cart count etc.)
      dispatch(fetchFarmer());
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600 mt-1">
            Browse agricultural products and add them to your cart.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full sm:w-80 rounded-xl border border-gray-200 bg-white px-3 py-2"
        />
      </div>

      {loading ? <p className="p-10">Loading products...</p> : null}
      {error ? <p className="p-10 text-red-600">{error}</p> : null}

      {!loading && !error && filtered.length === 0 ? (
        <div className="mt-10 text-center border rounded-2xl p-10 bg-gray-50">
          <p className="text-gray-500">No products found.</p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <ProductCard
            key={p.productId}
            p={p}
            onAdd={onAdd}
            adding={addingId === p.productId}
          />
        ))}
      </div>
    </div>
  );
};

export default Product;
