import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/redux";
import Card from "../../ui/Card";
import Info from "../../ui/Info";
import { api } from "../../lib/api";
import { fetchFarmer } from "../../store/redux/farmerSlice";
import type {
  Lease,
  LeaseCreateBody,
  LeaseModelType,
  LeaseStatus,
} from "../../types/type";

const badge: Record<LeaseStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  TERMINATED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-gray-200 text-gray-700",
};

const LeaseComponent = () => {
  const dispatch = useDispatch<any>();
  const farmer = useSelector((s: RootState) => s.farmer.data);
  const loading = useSelector((s: RootState) => s.farmer.loading);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string>("");
  const [ok, setOk] = useState<string>("");

  const fields = farmer?.fields ?? [];

  const [leases, setLeases] = useState<Lease[]>([]);
  const [leaseLoading, setLeaseLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeaseStatus>("ALL");
  const [modelType, setModelType] = useState<LeaseModelType>("STANDARD");
  const [leaseStatusOptions, setLeaseStatusOptions] = useState<LeaseStatus[]>([
    "PENDING",
    "ACTIVE",
    "EXPIRED",
    "TERMINATED",
  ]);
  const [leaseModelOptions, setLeaseModelOptions] = useState<LeaseModelType[]>([
    "STANDARD",
    "HYBRID",
  ]);

  const [editing, setEditing] = useState<Lease | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Latest lease per field (to disable selecting fields that already have an ACTIVE/PENDING lease)
  const fieldHasLease = useMemo(() => {
    const latestByField = new Map<string, Lease>();

    for (const l of leases) {
      const fid = (l as any).fieldId ?? (l as any).field?.fieldId;
      if (!fid) continue;

      const prev = latestByField.get(fid);
      const prevAt = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
      const curAt = l.createdAt ? new Date(l.createdAt).getTime() : 0;
      if (!prev || curAt >= prevAt) {
        latestByField.set(fid, l);
      }
    }

    const set = new Set<string>();
    for (const [fid, l] of latestByField.entries()) {
      if (l.status === "ACTIVE" || l.status === "PENDING") set.add(fid);
    }
    return set;
  }, [leases]);
  const refreshLeases = async () => {
    setLeaseLoading(true);
    try {
      const res = await api.get("/lease");
      const list: Lease[] = res.data.data ?? res.data ?? [];
      setLeases(list);
    } catch {
      setLeases([]);
    } finally {
      setLeaseLoading(false);
    }
  };

  // Pull latest enum values from backend so dropdowns stay in sync
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/enum");
        const raw = res?.data?.data ?? res?.data ?? {};
        const statuses =
          // Backend key is singular: leaseStatus
          ((raw.leaseStatus ?? raw.LeaseStatus) as LeaseStatus[] | undefined) ??
          null;
        const models =
          ((raw.leaseModelTypes ?? raw.LeaseModelType) as
            | LeaseModelType[]
            | undefined) ?? null;

        if (Array.isArray(statuses) && statuses.length) {
          setLeaseStatusOptions(statuses);
        }
        if (Array.isArray(models) && models.length) {
          setLeaseModelOptions(models);
        }
      } catch {
        // keep defaults
      }
    })();
  }, []);

  // Fetch all leases from server (not only dashboard)
  useEffect(() => {
    // let mounted = true;
    (async () => {
      await refreshLeases();
    })();
    return () => {
      // mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onEditLease = (lease: Lease) => {
    setEditing(lease);
    setOk("");
    setErr("");
    setModelType(lease.modelType);
  };

  const onDeleteLease = async (leaseId: string) => {
    try {
      setActionBusy(leaseId);
      setErr("");
      setOk("");
      await api.delete(`/lease/${leaseId}`);
      setOk("Lease cancelled successfully");
      await refreshLeases();
      await dispatch(fetchFarmer());
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ?? e?.message ?? "Failed to delete lease",
      );
    } finally {
      setActionBusy(null);
    }
  };

  const onEndLease = async (leaseId: string) => {
    try {
      setActionBusy(leaseId);
      setErr("");
      setOk("");
      await api.post(`/lease/${leaseId}/end`);
      setOk("Lease ended successfully");
      await refreshLeases();
      await dispatch(fetchFarmer());
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to end lease");
    } finally {
      setActionBusy(null);
    }
  };

  // Leases posted by this farmer (he can only give for rent)
  const myLeases = useMemo(() => {
    // /lease already returns leases for the logged-in farmer's fields
    const list = leases ?? [];
    const filtered =
      statusFilter === "ALL"
        ? list
        : list.filter((l) => l.status === statusFilter);
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [leases, statusFilter]);

  // Latest lease per field (by createdAt). We only block posting a new lease
  // if the latest lease is still ACTIVE or PENDING.
  const latestLeaseByField = useMemo(() => {
    const map = new Map<string, Lease>();

    for (const l of leases ?? []) {
      const fid =
        typeof l.fieldId === "string" ? l.fieldId : l.fieldId?.fieldId;

      if (!fid) continue;

      const prev = map.get(fid);

      if (!prev) {
        map.set(fid, l);
        continue;
      }

      if (
        new Date(l.createdAt).getTime() > new Date(prev.createdAt).getTime()
      ) {
        map.set(fid, l);
      }
    }

    return map;
  }, [leases]);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setSubmitting(true);

    try {
      const fd = new FormData(e.currentTarget);

      const payload: LeaseCreateBody = {
        fieldId: String(fd.get("fieldId") || ""),
        modelType: String(fd.get("modelType") || "STANDARD") as LeaseModelType,
        rentAmount: String(fd.get("rentAmount") || "").trim(),
        profitSharePct:
          fd.get("profitSharePct") === null ||
          String(fd.get("profitSharePct")).trim() === ""
            ? null
            : Number(fd.get("profitSharePct")),
        startDate: String(fd.get("startDate") || ""),
        endDate: fd.get("endDate") ? String(fd.get("endDate")) : null,
        notes: fd.get("notes") ? String(fd.get("notes")) : null,
      };

      if (!payload.fieldId || !payload.startDate) {
        throw new Error("Please choose a field and start date");
      }

      // Basic validation based on model type
      if (!payload.rentAmount) {
        throw new Error("Rent amount is required");
      }

      // Rule: 1 lease per field. If field already has a lease, user must edit.
      if (!editing) {
        const latest = latestLeaseByField.get(payload.fieldId);
        if (
          latest &&
          (latest.status === "ACTIVE" || latest.status === "PENDING")
        ) {
          throw new Error(
            "This field already has an ACTIVE/PENDING lease. Please edit or cancel it first.",
          );
        }
      }

      if (editing) {
        await api.patch(`/lease/${editing.leaseId}`, payload);
        setOk("Lease updated successfully");
        setEditing(null);
      } else {
        await api.post("/lease", payload);
        setOk("Lease posted successfully");
      }
      setOk("Lease posted successfully");
      e.currentTarget.reset();
      dispatch(fetchFarmer());
      // refresh leases list
      const res = await api.get("/lease");
      const list: Lease[] = res.data.data ?? res.data ?? [];
      setLeases(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create lease");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !farmer) return <p className="p-10">Loading...</p>;
  if (!farmer) return <p className="p-10">Please login</p>;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lease</h1>
        <p className="text-sm text-gray-600 mt-1">
          Post a lease for your field and track active leases
        </p>
      </div>

      {/* 1) Post Lease */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Post a Lease
        </h2>

        <form
          onSubmit={onCreate}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Field
            </label>
            <select
              name="fieldId"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select field
              </option>
              {fields.map((f) => {
                const hasLease = fieldHasLease.has(f.fieldId);
                const disabled = !editing && hasLease;
                return (
                  <option key={f.fieldId} value={f.fieldId} disabled={disabled}>
                    Survey #{f.surveyNumber} • {f.acres} acres
                    {disabled ? " (Lease exists)" : ""}
                  </option>
                );
              })}
            </select>
            {!editing && fieldHasLease.size === fields.length ? (
              <p className="mt-1 text-xs text-gray-500">
                All your fields already have a lease. Use the list below to
                edit.
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Model
            </label>
            <select
              name="modelType"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              defaultValue="STANDARD"
              onChange={(e) => setModelType(e.target.value as LeaseModelType)}
            >
              {leaseModelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Rent Amount (₹)
            </label>
            <input
              name="rentAmount"
              placeholder="e.g. 25000"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Profit Share (%)
            </label>
            <input
              name="profitSharePct"
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 30"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              disabled={modelType === "STANDARD"}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Start Date
            </label>
            <input
              name="startDate"
              type="date"
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-gray-500">
              End Date (optional)
            </label>
            <input
              name="endDate"
              type="date"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any extra details (water, duration, expectations...)"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
            />
          </div>

          {err ? (
            <p className="text-sm text-red-600 md:col-span-2">{err}</p>
          ) : null}
          {ok ? (
            <p className="text-sm text-green-700 md:col-span-2">{ok}</p>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <button
              disabled={submitting}
              className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post Lease"}
            </button>
          </div>
        </form>
      </Card>

      {/* 2) My Leases (filterable) */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">My Leases</h2>

          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="ALL">ALL</option>
              {leaseStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {leaseLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading leases...</p>
        ) : myLeases.length === 0 ? (
          <div className="mt-4 text-center border rounded-2xl p-10 bg-gray-50">
            <p className="text-gray-500">
              No leases found for the selected filter.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {myLeases.map((lease) => (
              <div
                key={lease.leaseId}
                className="rounded-2xl border bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Field
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {lease.fieldId?.surveyNumber
                        ? `Survey #${lease.fieldId.surveyNumber}`
                        : "—"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${badge[lease.status]}`}
                  >
                    {lease.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                  <Info label="Model" value={lease.modelType} />
                  <Info
                    label="Rent"
                    value={lease.rentAmount ? `₹${lease.rentAmount}` : "—"}
                  />
                  <Info
                    label="Profit Share"
                    value={
                      lease.profitSharePct !== null &&
                      lease.profitSharePct !== undefined
                        ? `${lease.profitSharePct}%`
                        : "—"
                    }
                  />
                  <Info
                    label="Start"
                    value={new Date(lease.startDate).toDateString()}
                  />
                </div>

                {lease.notes ? (
                  <p className="mt-4 text-sm text-gray-600">{lease.notes}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEditLease(lease)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  {lease.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => onEndLease(lease.leaseId)}
                      disabled={actionBusy === lease.leaseId}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      {actionBusy === lease.leaseId ? "Ending..." : "End Lease"}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onDeleteLease(lease.leaseId)}
                    disabled={actionBusy === lease.leaseId}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {actionBusy === lease.leaseId ? "Cancelling..." : "Cancel"}
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  Lease ID: {lease.leaseId} • Field ID:{" "}
                  {typeof lease.fieldId === "string"
                    ? lease.fieldId
                    : (lease.fieldId?.fieldId ?? "—")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseComponent;
