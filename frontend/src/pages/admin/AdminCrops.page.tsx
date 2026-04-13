import { useEffect, useMemo, useState } from "react";
import Card from "../../ui/Card";
import { api } from "../../lib/api";

type Crop = {
  cropId: string;
  name: string;
  category: string;
  isActive: boolean;
  defaultYieldPerAcre?: string | null;
  defaultCostPerAcre?: string | null;
  durationDays?: number | null;
  marketPricePerUnit?: string | null;
  createdAt: string;
};

const AdminCropsPage = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "OTHER",
    defaultYieldPerAcre: "",
    defaultCostPerAcre: "",
    durationDays: "",
    marketPricePerUnit: "",
    isActive: true,
  });

  const fetchCrops = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/crops");
      setCrops(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load crops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return crops;
    return crops.filter((c) =>
      [c.name, c.category].some((v) => String(v ?? "").toLowerCase().includes(query))
    );
  }, [crops, q]);

  const createCrop = async () => {
    setError("");
    if (!form.name.trim()) {
      setError("Crop name is required");
      return;
    }
    try {
      await api.post("/admin/crops", {
        name: form.name,
        category: form.category,
        defaultYieldPerAcre: form.defaultYieldPerAcre || undefined,
        defaultCostPerAcre: form.defaultCostPerAcre || undefined,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        marketPricePerUnit: form.marketPricePerUnit || undefined,
        isActive: form.isActive,
      });
      setForm({
        name: "",
        category: "OTHER",
        defaultYieldPerAcre: "",
        defaultCostPerAcre: "",
        durationDays: "",
        marketPricePerUnit: "",
        isActive: true,
      });
      await fetchCrops();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to create crop");
    }
  };

  const toggleActive = async (crop: Crop) => {
    try {
      await api.patch(`/admin/crops/${crop.cropId}`, { isActive: !crop.isActive });
      await fetchCrops();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update crop");
    }
  };

  const removeCrop = async (crop: Crop) => {
    if (!confirm(`Delete crop "${crop.name}"?`)) return;
    try {
      await api.delete(`/admin/crops/${crop.cropId}`);
      await fetchCrops();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete crop");
    }
  };

  return (
    <div className="max-w-[950px] p-10 m-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin • Crop Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create, enable/disable, and manage crops available to farmers.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Create crop</h2>
        {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. RICE"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            >
              {[
                "CEREAL",
                "PULSE",
                "OILSEED",
                "FRUIT",
                "VEGETABLE",
                "SPICE",
                "FIBER",
                "PLANTATION",
                "FLORICULTURE",
                "OTHER",
              ].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Default yield / acre (optional)</label>
            <input
              value={form.defaultYieldPerAcre}
              onChange={(e) => setForm((p) => ({ ...p, defaultYieldPerAcre: e.target.value }))}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Default cost / acre (optional)</label>
            <input
              value={form.defaultCostPerAcre}
              onChange={(e) => setForm((p) => ({ ...p, defaultCostPerAcre: e.target.value }))}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Duration days (optional)</label>
            <input
              value={form.durationDays}
              onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
              type="number"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">Market price/unit (optional)</label>
            <input
              value={form.marketPricePerUnit}
              onChange={(e) => setForm((p) => ({ ...p, marketPricePerUnit: e.target.value }))}
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active (visible to farmers)
          </label>

          <button
            onClick={createCrop}
            className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Create
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-800">All crops</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or category"
            className="w-full md:w-80 rounded-xl border border-gray-200 bg-white px-3 py-2"
          />
        </div>

        {loading ? <p className="mt-3 text-sm text-gray-500">Loading...</p> : null}

        <div className="mt-4 space-y-3">
          {filtered.map((c) => (
            <div
              key={c.cropId}
              className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-600">
                  {c.category} • Yield/acre: {c.defaultYieldPerAcre ?? "—"} • Cost/acre: {c.defaultCostPerAcre ?? "—"}
                  {c.durationDays ? ` • ${c.durationDays} days` : ""}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(c)}
                  className={`rounded-xl border px-4 py-2 text-sm ${
                    c.isActive
                      ? "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
                      : "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                  }`}
                >
                  {c.isActive ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => removeCrop(c)}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading ? (
            <p className="text-sm text-gray-500">No crops found.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default AdminCropsPage;
