import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../../store/redux";
import { fetchFarmer } from "../../store/redux/farmerSlice";
import { api } from "../../lib/api";

import FieldDetailSectionComponent from "./FieldDetailSectionComponent";
import CropDetailComponent from "./CropDetailComponent";
import LeaseComponent from "./LeaseComponent";
import SnapchatComponent from "./SnapchatComponent";
import Card from "../../ui/Card";

type EnumResponse = {
  LandType?: string[];
  SoilType?: string[];
  IrrigationType?: string[];
  Region?: string[];
  CropStatus?: string[];
  FieldPlanStatus?: string[];
  LeaseModelType?: string[];
  LeaseStatus?: string[];
};

type Crop = { cropId: string; name: string; category?: string };
type Season = { seasonId: string; name: string; startDate: string; endDate: string };

const FieldDetailComponent = () => {
  const { fieldId } = useParams();
  const navigate = useNavigate();


const [fieldDetails, setFieldDetails] = useState<any>(null);
const [snapshotForm, setSnapshotForm] = useState({
  soilMoisture: "",
  soilPH: "",
  nitrogenLevel: "",
  phosphorusLevel: "",
  potassiumLevel: "",
  notes: "",
});
const [snapshotSaving, setSnapshotSaving] = useState(false);
const [snapshotError, setSnapshotError] = useState("");

  const dispatch = useDispatch<any>();

  const farmerData = useSelector((state: RootState) => state.farmer.data);
  const loading = useSelector((state: RootState) => state.farmer.loading);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");
  const [ok, setOk] = useState<string>("");

  // crop history view
  const [showAllHistory, setShowAllHistory] = useState(false);

  // dropdown data
  const [enums, setEnums] = useState<EnumResponse>({});
  const [crops, setCrops] = useState<Crop[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  // load dropdowns
  
useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      if (!fieldId) return;
      const res = await api.get(`/field/${fieldId}`);
      // ApiResponse format
      const data = res.data?.data ?? res.data;
      if (mounted) setFieldDetails(data);
    } catch (e) {
      // ignore; user might not be logged in yet
    }
  })();
  

return () => {
    mounted = false;
  };
}, [fieldId]);

const submitSnapshot = async () => {
  if (!field?.fieldId) return;
  setSnapshotError("");
  setSnapshotSaving(true);
  try {
    const payload: any = {
      soilMoisture: snapshotForm.soilMoisture ? Number(snapshotForm.soilMoisture) : null,
      soilPH: snapshotForm.soilPH ? Number(snapshotForm.soilPH) : null,
      nitrogenLevel: snapshotForm.nitrogenLevel ? Number(snapshotForm.nitrogenLevel) : null,
      phosphorusLevel: snapshotForm.phosphorusLevel ? Number(snapshotForm.phosphorusLevel) : null,
      potassiumLevel: snapshotForm.potassiumLevel ? Number(snapshotForm.potassiumLevel) : null,
      notes: snapshotForm.notes || null,
    };
    await api.post(`/snapshot/${field.fieldId}/create-snapshot`, payload);
    const refreshed = await api.get(`/field/${field.fieldId}`);
    setFieldDetails(refreshed.data?.data ?? refreshed.data);
    setSnapshotForm({
      soilMoisture: "",
      soilPH: "",
      nitrogenLevel: "",
      phosphorusLevel: "",
      potassiumLevel: "",
      notes: "",
    });
  } catch (e: any) {
    setSnapshotError(e?.response?.data?.message ?? "Failed to save snapshot");
  } finally {
    setSnapshotSaving(false);
  }
};


useEffect(() => {
    (async () => {
      try {
        const [enumRes, cropsRes, seasonsRes] = await Promise.all([
          api.get("/enum"),
          api.get("/crops"),
          api.get("/seasons"),
        ]);

        const raw = enumRes?.data?.data ?? enumRes?.data ?? {};
        // Normalize enum payload (backend uses lower-camel keys)
        setEnums({
          LandType: raw.landTypes ?? raw.LandType,
          SoilType: raw.soilTypes ?? raw.SoilType,
          IrrigationType: raw.irrigationTypes ?? raw.IrrigationType,
          // Backend keys are singular: fieldPlanStatus, cropStatus, leaseStatus
          CropStatus: raw.cropStatus ?? raw.CropStatus,
          FieldPlanStatus: raw.fieldPlanStatus ?? raw.FieldPlanStatus,
          LeaseModelType: raw.leaseModelTypes ?? raw.LeaseModelType,
          LeaseStatus: raw.leaseStatus ?? raw.LeaseStatus,
        });
        setCrops(cropsRes?.data?.data ?? cropsRes?.data ?? []);
        setSeasons(seasonsRes?.data?.data ?? seasonsRes?.data ?? []);
      } catch {
        // non-fatal: page can still render
      }
    })();
  }, []);

  // guards
  if (loading && !farmerData) return <p className="p-10">Loading...</p>;
  if (!farmerData) return <p className="p-10">Please login</p>;

  // Prefer server-fresh field details (includes latest leases, full plan history, snapshots, etc.)
  const field = (fieldDetails as any) ?? farmerData.fields?.find((f: any) => f.fieldId === fieldId);
  if (!field) return <p className="p-10">Field not found</p>;

  // Backend returns plans under `plans` (Field.plans include crop+season).
  // Some older payloads used `fieldSeasonPlan`, so we support both.
  const plans = field.plans ?? field.fieldSeasonPlan ?? [];

  // ✅ Editable plan = latest plan that is not ended/completed.
  // Fixes: when a plan is PLANNED (not ACTIVE), the edit form was not pre-populating.
  const editablePlan = useMemo(() => {
    const isEnded = (p: any) =>
      String(p?.status).toUpperCase() === "COMPLETED" ||
      String(p?.cropStatus).toUpperCase() === "HARVESTED" ||
      String(p?.cropStatus).toUpperCase() === "DAMAGED";

    // plans are already ordered desc from API/dashboard
    return (plans as any[]).find((p) => !isEnded(p)) ?? null;
  }, [plans]);

  // For display cards: show editable if exists, else latest plan (usually latest completed)
  const planForDisplay = editablePlan ?? plans[0];

  // For edit form: edit the latest non-ended plan; if none, user is creating a new plan
  const planForEdit = editablePlan;


  const [cropStatusSel, setCropStatusSel] = useState<string>("");
  const [planStatusSel, setPlanStatusSel] = useState<string>("");

  useEffect(() => {
    setCropStatusSel(planForEdit?.cropStatus ?? "");
    setPlanStatusSel(planForEdit?.status ?? "PLANNED");
  }, [planForEdit?.planId]);

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setSaving(true);

    try {
      const fd = new FormData(e.currentTarget);

      // Field update: backend expects multipart (multer) on PATCH /field/update-field/:fieldId
      const body = new FormData();
      body.set("landType", String(fd.get("landType") || field.landType));
      body.set("soilType", String(fd.get("soilType") || field.soilType));
      body.set(
        "irrigationType",
        String(fd.get("irrigationType") || field.irrigationType)
      );
      body.set("surveyNumber", String(fd.get("surveyNumber") || field.surveyNumber));
      body.set("acres", String(fd.get("acres") || field.acres));
      body.set("region", fd.get("region") ? String(fd.get("region")) : "");

      const landImage = fd.get("landImage");
      if (landImage instanceof File && landImage.size > 0) {
        body.set("landImage", landImage);
      }

      await api.patch(`/field/update-field/${field.fieldId}`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Season plan (optional)
      const seasonId = String(fd.get("seasonId") || "");
      const cropId = String(fd.get("cropId") || "");

      if (planForEdit?.planId) {
        // ✅ Edit ONLY the active plan (do NOT send cropId/seasonId)
        await api.patch(`/season-plan/plan/${planForEdit.planId}`, {
          cropStatus: fd.get("cropStatus") ? String(fd.get("cropStatus")) : undefined,
          status: fd.get("planStatus") ? String(fd.get("planStatus")) : undefined,
          sowingDate: fd.get("sowingDate")
            ? new Date(String(fd.get("sowingDate"))).toISOString()
            : undefined,
          expectedYield: fd.get("expectedYield") ? String(fd.get("expectedYield")) : undefined,
          expectedCost: fd.get("expectedCost") ? String(fd.get("expectedCost")) : undefined,
          actualYield: fd.get("actualYield") ? String(fd.get("actualYield")) : undefined,
        });
      } else if (seasonId && cropId) {
        // ✅ No active plan → create a NEW plan
        await api.post(`/season-plan/${field.fieldId}/create-season-plan`, {
          seasonId,
          cropId,
          status: fd.get("planStatus") ? String(fd.get("planStatus")) : "PLANNED",
          cropStatus: fd.get("cropStatus") ? String(fd.get("cropStatus")) : undefined,
          sowingDate: fd.get("sowingDate")
            ? new Date(String(fd.get("sowingDate"))).toISOString()
            : null,
          expectedYield: fd.get("expectedYield") ? String(fd.get("expectedYield")) : null,
          expectedCost: fd.get("expectedCost") ? String(fd.get("expectedCost")) : null,
        });
      }

      setOk("Updated successfully");
      setEditing(false);
      dispatch(fetchFarmer());
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteField = async () => {
    if (!confirm("Delete this field? This will remove the field and its related records.")) return;
    try {
      await api.delete(`/field/delete-field/${field.fieldId}`);
      dispatch(fetchFarmer());
      navigate("/fields");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete field");
    }
  };

  const activeLease = field.leases?.[0] ?? null;
  const leaseStatus = activeLease?.status ?? "N/A";
  const snapshot = field?.snapshots?.[0] ?? field?.fieldSnapchat?.[0];

  return (
    <div className="max-w-[950px] p-10 m-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Survey #{field.surveyNumber} • {field.acres} acres
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            {editing ? "Close" : "Edit"}
          </button>

          <button
            onClick={onDeleteField}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>

      {field.landImage ? (
        <div className="image-container rounded-xl overflow-hidden">
          <img
            className="h-full w-full object-cover"
            src={field.landImage}
            alt={field.landType}
          />
        </div>
      ) : null}

      {editing ? (
        <Card>
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Edit field</h2>

          <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Land type</label>
              <select
                name="landType"
                defaultValue={field.landType}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {(enums.LandType ?? [field.landType]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Soil type</label>
              <select
                name="soilType"
                defaultValue={field.soilType}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {(enums.SoilType ?? [field.soilType]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Irrigation</label>
              <select
                name="irrigationType"
                defaultValue={field.irrigationType}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {(enums.IrrigationType ?? [field.irrigationType]).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Region</label>
              <input
                name="region"
                defaultValue={field.region ?? ""}
                placeholder="e.g. Tumakuru"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Survey number</label>
              <input
                name="surveyNumber"
                type="number"
                defaultValue={field.surveyNumber}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Acres</label>
              <input
                name="acres"
                defaultValue={field.acres}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Season plan (optional)</h3>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Season</label>
              <select
                name="seasonId"
                disabled={Boolean(planForEdit)}
                defaultValue={planForEdit?.seasonId ?? planForEdit?.season?.seasonId ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <option value="">—</option>
                {seasons.map((s) => (
                  <option key={s.seasonId} value={s.seasonId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Crop</label>
              <select
                name="cropId"
                disabled={Boolean(planForEdit)}
                defaultValue={planForEdit?.cropId ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <option value="">—</option>
                {crops.map((c) => (
                  <option key={c.cropId} value={c.cropId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Plan status</label>
              <select
                name="planStatus"
                defaultValue={planForEdit?.status ?? "PLANNED"}
                onChange={(e) => setPlanStatusSel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <option value="">—</option>
                {(enums.FieldPlanStatus ?? []).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Crop status</label>
              <select
                name="cropStatus"
                defaultValue={planForEdit?.cropStatus ?? ""}
                onChange={(e) => setCropStatusSel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <option value="">—</option>
                {(enums.CropStatus ?? []).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Sowing date</label>
              <input
                name="sowingDate"
                type="date"
                defaultValue={planForEdit?.sowingDate ? new Date(planForEdit.sowingDate).toISOString().slice(0, 10) : ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>


            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Expected Yield (optional)</label>
              <input
                name="expectedYield"
                type="number"
                step="0.01"
                defaultValue={planForEdit?.expectedYield ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                placeholder="e.g. 1200"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">Expected Cost (optional)</label>
              <input
                name="expectedCost"
                type="number"
                step="0.01"
                defaultValue={planForEdit?.expectedCost ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                placeholder="e.g. 5000"
              />
            </div>

            {planForEdit?.planId && (cropStatusSel === "HARVESTED" || planStatusSel === "COMPLETED") ? (
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500">Actual Yield (enter after harvest)</label>
                <input
                  name="actualYield"
                  type="number"
                  step="0.01"
                  defaultValue={planForEdit?.actualYield ?? ""}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  placeholder="e.g. 1100"
                />
              </div>
            ) : null}


            {err ? <p className="text-sm text-red-600 md:col-span-2">{err}</p> : null}
            {ok ? <p className="text-sm text-green-700 md:col-span-2">{ok}</p> : null}

            <div className="md:col-span-2 flex justify-end">
              <button
                disabled={saving}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Existing UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FieldDetailSectionComponent
          heading="Field Details"
          landType={field.landType}
          soilType={field.soilType}
          reagion={field.region ?? "N/A"}
          createdAt={new Date(field.createdAt).toDateString()}
        />

        <CropDetailComponent
          cropName={planForDisplay?.crop?.name ?? field.currentCrop?.name ?? field.crops?.[0]?.name ?? "—"}
          season={planForDisplay?.season?.name ?? planForDisplay?.seasonId ?? "—"}
          status={planForDisplay?.status ?? "—"}
          cropStatus={planForDisplay?.cropStatus ?? "—"}
        />

        <SnapchatComponent heading="Latest Snapshot" snapshot={snapshot} />

<div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
  <div className="flex items-center justify-between">
    <h3 className="text-sm font-semibold text-gray-800">Add Latest Snapshot</h3>
  </div>
  {snapshotError ? (
    <p className="mt-2 text-sm text-red-600">{snapshotError}</p>
  ) : null}
  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
    <input
      className="rounded-xl border border-gray-200 px-3 py-2"
      placeholder="Soil Moisture"
      value={snapshotForm.soilMoisture}
      onChange={(e) => setSnapshotForm((p: any) => ({ ...p, soilMoisture: e.target.value }))}
    />
    <input
      className="rounded-xl border border-gray-200 px-3 py-2"
      placeholder="Soil pH"
      value={snapshotForm.soilPH}
      onChange={(e) => setSnapshotForm((p: any) => ({ ...p, soilPH: e.target.value }))}
    />
    <input
      className="rounded-xl border border-gray-200 px-3 py-2"
      placeholder="Nitrogen"
      value={snapshotForm.nitrogenLevel}
      onChange={(e) => setSnapshotForm((p: any) => ({ ...p, nitrogenLevel: e.target.value }))}
    />
    <input
      className="rounded-xl border border-gray-200 px-3 py-2"
      placeholder="Phosphorus"
      value={snapshotForm.phosphorusLevel}
      onChange={(e) => setSnapshotForm((p: any) => ({ ...p, phosphorusLevel: e.target.value }))}
    />
    <input
      className="rounded-xl border border-gray-200 px-3 py-2"
      placeholder="Potassium"
      value={snapshotForm.potassiumLevel}
      onChange={(e) => setSnapshotForm((p: any) => ({ ...p, potassiumLevel: e.target.value }))}
    />
    <input
      className="rounded-xl border border-gray-200 px-3 py-2 md:col-span-2"
      placeholder="Notes (optional)"
      value={snapshotForm.notes}
      onChange={(e) => setSnapshotForm((p: any) => ({ ...p, notes: e.target.value }))}
    />
  </div>

  <button
    className="mt-3 w-full rounded-xl bg-green-600 px-4 py-2 text-white disabled:opacity-60"
    onClick={submitSnapshot}
    disabled={snapshotSaving}
    type="button"
  >
    {snapshotSaving ? "Saving..." : "Save Snapshot"}
  </button>
</div>



        <LeaseComponent lease={activeLease} leaseStatus={leaseStatus} onDeleted={() => dispatch(fetchFarmer())} />
      </div>

      {/* Crop History */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Crop History</h2>
        {(() => {
          const completedPlans = (plans || [])
            .filter((p: any) => String(p.status).toUpperCase() === "COMPLETED")
            .sort(
              (a: any, b: any) =>
                new Date(b.actualEndDate || b.updatedAt || 0).getTime() -
                new Date(a.actualEndDate || a.updatedAt || 0).getTime()
            );

          if (completedPlans.length === 0) {
            return <p className="text-sm text-gray-500">No completed crops yet.</p>;
          }

          const visible = showAllHistory ? completedPlans : completedPlans.slice(0, 2);

          return (
            <>
              <div className="space-y-3">
                {visible.map((p: any) => (
                  <div key={p.planId} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-semibold text-gray-900">
                        {p.crop?.name ?? p.cropId}
                        <span className="text-gray-500 font-normal"> • {p.season?.name ?? p.seasonId}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Ended: {p.actualEndDate ? new Date(p.actualEndDate).toDateString() : "—"}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                      <div>Expected Yield: {p.expectedYield ?? "—"}</div>
                      <div>Actual Yield: {p.actualYield ?? "—"}</div>
                      <div>Cost: {p.actualCost ?? p.expectedCost ?? "—"}</div>
                    </div>
                  </div>
                ))}
              </div>

              {completedPlans.length > 2 ? (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllHistory((v) => !v)}
                    className="text-green-600 text-sm font-medium hover:underline"
                  >
                    {showAllHistory ? "Show Less" : "View More"}
                  </button>
                </div>
              ) : null}
            </>
          );
        })()}
      </Card>
    </div>
  );
};

export default FieldDetailComponent;
