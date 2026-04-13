import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Lease = any;

const AdminLeasesPage = () => {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statuses = ["PENDING", "ACTIVE", "EXPIRED", "TERMINATED", "CANCELLED"] as const;

  const fetchLeases = async () => {
    setLoading(true);
    setError(null);
    try {
      // show ALL leases so admin can operate like an e-commerce backoffice
      const res = await api.get("/admin/leases");
      setLeases(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load leases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  const updateStatus = async (leaseId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/leases/${leaseId}/status`, { status });
      const updated = res.data?.data ?? res.data;
      setLeases((prev) => prev.map((l: any) => (l.leaseId === leaseId ? updated : l)));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update lease status");
    }
  };

  const cancelLease = async (leaseId: string) => {
    await updateStatus(leaseId, "CANCELLED");
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leases (Admin)</h1>
        <button
          onClick={fetchLeases}
          className="rounded-xl bg-green-600 px-4 py-2 text-white text-sm hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="mt-6">Loading...</div>}
      {error && <div className="mt-6 text-red-600">{error}</div>}

      <div className="mt-6 space-y-3">
        {leases.map((l: any) => (
          <div key={l.leaseId} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-semibold">
                  Field: {l.field?.surveyNumber ?? l.field?.fieldId}
                </div>
                <div className="text-sm text-gray-600">
                  Farmer: {l.field?.farmer?.fullName ?? l.field?.farmer?.username ?? "-"} ({l.field?.farmer?.email ?? "-"})
                </div>
                <div className="text-sm text-gray-600">
                  Rent: ₹{String(l.rentAmount)}{" "}
                  {l.profitSharePct ? `• Profit share: ${String(l.profitSharePct)}%` : ""}
                </div>
              </div>

              <div className="text-right text-sm min-w-[220px]">
                <div className="font-medium mb-2">{l.status}</div>
                <div className="flex items-center justify-end gap-2">
                  <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={l.status}
                    onChange={(e) => updateStatus(l.leaseId, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => cancelLease(l.leaseId)}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                    title="Soft-cancel (status=CANCELLED)"
                  >
                    Cancel
                  </button>
                </div>
                <div className="text-gray-600">
                  Approved: {l.approvedAt ? new Date(l.approvedAt).toLocaleString() : "-"}
                </div>
                <div className="text-gray-600">
                  Start: {l.startDate ? new Date(l.startDate).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && leases.length === 0 && (
          <div className="text-gray-600">No leases yet.</div>
        )}
      </div>
    </div>
  );
};

export default AdminLeasesPage;
