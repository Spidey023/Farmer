import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Card from "../../ui/Card";

const seasonTypes = [
  "KHARIF",
  "RABI",
  "ZAID",
  "SUMMER",
  "WINTER",
  "AUTUMN",
  "OTHER",
];

const AdminSeasonsPage = () => {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/admin/seasons");
      setSeasons(res.data.data ?? []);
    } catch (err: any) {
      setError("Failed to load seasons");
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  const resetForm = () => {
    setForm({ name: "", startDate: "", endDate: "" });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const existingSeasonNames = useMemo(() => {
    return seasons.map((s) => s.name);
  }, [seasons]);

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await api.patch(`/admin/seasons/${editingId}`, {
          startDate: form.startDate,
          endDate: form.endDate,
        });
        setSuccess("Season updated successfully");
      } else {
        await api.post("/admin/seasons", form);
        setSuccess("Season created successfully");
      }

      resetForm();
      fetchSeasons();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Something went wrong while saving season";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (season: any) => {
    setEditingId(season.seasonId);
    setForm({
      name: season.name,
      startDate: season.startDate.slice(0, 10),
      endDate: season.endDate.slice(0, 10),
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this season?")) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/admin/seasons/${id}`);
      setSuccess("Season deleted successfully");
      fetchSeasons();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Unable to delete season";
      setError(message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Season Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create and manage agricultural seasons
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Season" : "Create Season"}
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-green-600 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={form.name}
            disabled={!!editingId}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              setError("");
            }}
            className="rounded-xl border border-gray-200 px-3 py-2"
          >
            <option value="">Select Season</option>
            {seasonTypes.map((s) => (
              <option
                key={s}
                value={s}
                disabled={!editingId && existingSeasonNames.includes(s)}
              >
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={form.startDate}
            onChange={(e) => {
              setForm((p) => ({ ...p, startDate: e.target.value }));
              setError("");
            }}
            className="rounded-xl border border-gray-200 px-3 py-2"
          />

          <input
            type="date"
            value={form.endDate}
            onChange={(e) => {
              setForm((p) => ({ ...p, endDate: e.target.value }));
              setError("");
            }}
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`rounded-xl px-5 py-2 text-sm text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Saving..." : editingId ? "Update" : "Create"}
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Existing Seasons
        </h2>

        {seasons.length === 0 ? (
          <p className="text-sm text-gray-500">No seasons created yet.</p>
        ) : (
          <div className="space-y-3">
            {seasons.map((season) => (
              <div
                key={season.seasonId}
                className="rounded-xl border border-gray-200 bg-white p-4 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {season.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(season.startDate).toDateString()} →{" "}
                    {new Date(season.endDate).toDateString()}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(season)}
                    className="text-blue-600 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(season.seasonId)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminSeasonsPage;
