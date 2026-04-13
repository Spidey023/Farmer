import { useState } from "react";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import { api } from "../../lib/api";

type Lease = {
  leaseId: string;
  status: string;
  modelType?: string;
  rentAmount?: any;
  profitSharePct?: any;
  startDate?: string;
  endDate?: string | null;
};

const LeaseComponent = ({
  leaseStatus,
  lease,
  onDeleted,
  className = "",
}: {
  leaseStatus: string;
  lease: Lease | null;
  onDeleted?: () => void;
  className?: string;
}) => {
  const display = leaseStatus === "N/A" ? "No Lease" : leaseStatus;
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string>("");

  const handleDelete = async () => {
    if (!lease?.leaseId) return;
    setErr("");
    setDeleting(true);
    try {
      await api.delete(`/lease/${lease.leaseId}`);
      onDeleted?.();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Failed to delete lease");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className={`relative h-full ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-1">
            Lease Details
          </h2>
          <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{display}</p>

          {lease?.rentAmount !== undefined && lease?.rentAmount !== null ? (
            <p className="text-sm text-gray-700 mt-2">Amount: ₹ {String(lease.rentAmount)}</p>
          ) : null}

          {lease?.leaseId && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              Lease ID: {lease.leaseId}
            </p>
          )}

          {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge>{leaseStatus}</Badge>

          {lease?.leaseId && lease?.status === "PENDING" && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LeaseComponent;
