import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/redux";

type Product = {
  productId: string;
  name: string;
  category: string;
  description?: string | null;
  imageUrl?: string | null;
  unit?: string | null;
  price: string; // Prisma Decimal serialized
  stock: number;
};

const AdminProductsPage = () => {
  const role = useSelector((s: RootState) => s.farmer.data?.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    category: "OTHER",
    unit: "",
    price: "",
    stock: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const canUse = useMemo(() => role === "ADMIN", [role]);

  const fetchProducts = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("/products");
      const data = res.data?.data ?? res.data;
      setProducts(data ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async () => {
    if (!form.name || !form.price || !form.stock) {
      setErr("Name, price, and stock are required");
      return;
    }
    setErr("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("price", form.price);
      fd.append("stock", String(form.stock));
      if (form.unit) fd.append("unit", form.unit);
      if (form.description) fd.append("description", form.description);
      if (form.imageUrl) fd.append("imageUrl", form.imageUrl);
      if (imageFile) fd.append("image", imageFile);

      await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm({ name: "", description: "", imageUrl: "", category: "OTHER", unit: "", price: "", stock: "" });
      setImageFile(null);
      await fetchProducts();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to create product");
    }
  };

  const updateProduct = async (p: Product) => {
    setErr("");
    try {
      const fd = new FormData();
      fd.append("name", p.name);
      fd.append("category", p.category);
      fd.append("price", String(p.price));
      fd.append("stock", String(p.stock));
      if (p.unit) fd.append("unit", p.unit);
      if (p.description) fd.append("description", p.description);
      if (p.imageUrl) fd.append("imageUrl", p.imageUrl);
      // NOTE: row-level image update not implemented here (simple admin).
      await api.patch(`/products/${p.productId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchProducts();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to update product");
    }
  };

  const deleteProduct = async (productId: string) => {
    setErr("");
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${productId}`);
      await fetchProducts();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to delete product");
    }
  };

  if (!canUse) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Admin Products</h1>
        <p className="mt-2 text-gray-600">You must be an admin to manage products.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin Products</h1>
        <p className="text-gray-600">Create, update, and delete products (admin-only).</p>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>}

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Add Product</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="border rounded-lg p-2"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          

          <input
            className="border rounded-lg p-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            className="border rounded-lg p-2"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />

          <input
            type="file"
            accept="image/*"
            className="border rounded-lg p-2"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
<select
            className="border rounded-lg p-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {["SEEDS","FERTILIZER","PESTICIDE","EQUIPMENT","IRRIGATION","TOOL","HARVEST","OTHER"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            className="border rounded-lg p-2"
            placeholder="Unit (optional)"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />

          <input
            className="border rounded-lg p-2"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <input
            className="border rounded-lg p-2"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>

        <button
          className="mt-3 rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
          onClick={createProduct}
        >
          Add
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Products</h2>
          <button className="text-sm underline" onClick={fetchProducts} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="p-2">Name</th>
                <th className="p-2">Category</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Price</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => (
                <tr key={p.productId} className={idx % 2 ? "bg-gray-50" : ""}>
                  <td className="p-2">
                    <input
                      className="w-full border rounded-lg p-1"
                      value={p.name}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx] = { ...p, name: e.target.value };
                        setProducts(next);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full border rounded-lg p-1"
                      value={p.category}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx] = { ...p, category: e.target.value };
                        setProducts(next);
                      }}
                    >
                      {["SEEDS","FERTILIZER","PESTICIDE","EQUIPMENT","IRRIGATION","TOOL","HARVEST","OTHER"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full border rounded-lg p-1"
                      value={p.unit ?? ""}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx] = { ...p, unit: e.target.value };
                        setProducts(next);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full border rounded-lg p-1"
                      value={p.price}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx] = { ...p, price: e.target.value };
                        setProducts(next);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full border rounded-lg p-1"
                      value={String(p.stock)}
                      onChange={(e) => {
                        const next = [...products];
                        next[idx] = { ...p, stock: Number(e.target.value) };
                        setProducts(next);
                      }}
                    />
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      className="rounded-lg border px-3 py-1"
                      onClick={() => updateProduct(products[idx])}
                    >
                      Save
                    </button>
                    <button
                      className="rounded-lg bg-red-600 px-3 py-1 text-white"
                      onClick={() => deleteProduct(p.productId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td className="p-2 text-gray-500" colSpan={6}>No products</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
