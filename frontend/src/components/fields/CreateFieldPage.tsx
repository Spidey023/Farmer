import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import Card from "../../ui/Card";
import { api } from "../../lib/api";
import { fetchFarmer } from "../../store/redux/farmerSlice";

import type {
  CropStatus,
  FieldPlanStatus,
  IrrigationType,
  LandType,
  SoilType,
  LeaseModelType,
} from "../../types/type";

type Crop = { cropId: string; name: string };
type Season = { seasonId: string; name: string };

const CreateFieldPage = () => {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [ok, setOk] = useState<string>("");

  // enums / dropdown sources
  const [landTypes, setLandTypes] = useState<string[]>([]);
  const [soilTypes, setSoilTypes] = useState<string[]>([]);
  const [irrigationTypes, setIrrigationTypes] = useState<string[]>([]);
  const [planStatuses, setPlanStatuses] = useState<string[]>([]);
  const [cropStatuses, setCropStatuses] = useState<string[]>([]);
  const [leaseModels, setLeaseModels] = useState<string[]>(["STANDARD", "HYBRID"]);

  const [crops, setCrops] = useState<Crop[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  // optional season plan
  const [enablePlan, setEnablePlan] = useState(true);
  const [seasonId, setSeasonId] = useState("");
  const [planCropId, setPlanCropId] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [planStatus, setPlanStatus] = useState<FieldPlanStatus>("PLANNED");
  // Must match Prisma enum values (see backend CropStatus)
  const [cropStatus, setCropStatus] = useState<CropStatus>("SOWN");

  // season plan optional numbers
  const [expectedYield, setExpectedYield] = useState<string>("");
  const [expectedCost, setExpectedCost] = useState<string>("");

  // optional lease post
  const [enableLease, setEnableLease] = useState(false);
  const [leaseModel, setLeaseModel] = useState<LeaseModelType>("STANDARD");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [enumRes, cropsRes, seasonsRes] = await Promise.all([
          api.get("/enum"),
          api.get("/crops"),
          api.get("/seasons"),
        ]);

        // Backend /enum returns lower-camel keys. Keep this mapping here so UI stays in sync.
        const raw = enumRes.data?.data ?? enumRes.data ?? {};
        const e = {
          LandType: raw.landTypes ?? raw.LandType,
          SoilType: raw.soilTypes ?? raw.SoilType,
          IrrigationType: raw.irrigationTypes ?? raw.IrrigationType,
          // Backend keys are singular: fieldPlanStatus, cropStatus
          FieldPlanStatus: raw.fieldPlanStatus ?? raw.FieldPlanStatus,
          CropStatus: raw.cropStatus ?? raw.CropStatus,
          LeaseModelType: raw.leaseModelTypes ?? raw.LeaseModelType,
        };
        if (!mounted) return;

        setLandTypes(e.LandType ?? []);
        setSoilTypes(e.SoilType ?? []);
        setIrrigationTypes(e.IrrigationType ?? []);
        setPlanStatuses(e.FieldPlanStatus ?? []);
        setCropStatuses(e.CropStatus ?? []);
        setLeaseModels(e.LeaseModelType ?? ["STANDARD", "HYBRID"]);

        setCrops(cropsRes.data?.data ?? []);
        setSeasons(seasonsRes.data?.data ?? []);
      } catch {
        // keep defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canCreatePlan = useMemo(() => {
    if (!enablePlan) return true;
    return Boolean(seasonId && planCropId);
  }, [enablePlan, seasonId, planCropId]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!canCreatePlan) {
      setError("Please select Season and Crop for the season plan.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);

      // Build multipart payload for /field (so land image can be optional)
      const body = new FormData();
      body.set("surveyNumber", String(fd.get("surveyNumber") || "").trim());
      body.set("acres", String(fd.get("acres") || "").trim());
      body.set("landType", String(fd.get("landType") || "").trim());
      body.set("soilType", String(fd.get("soilType") || "").trim());
      body.set("irrigationType", String(fd.get("irrigationType") || "").trim());
      body.set("region", String(fd.get("region") || "").trim());

      const landImage = fd.get("landImage");
      if (landImage instanceof File && landImage.size > 0) {
        body.set("landImage", landImage);
      }

      // 1) Create field
      // Backend route is /field/create-field
      const createRes = await api.post("/field/create-field", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const createdFieldId: string = createRes.data?.data?.fieldId;

      // 2) Optional: season plan
      if (enablePlan && createdFieldId && seasonId && planCropId) {
        await api.post(`/season-plan/${createdFieldId}/create-season-plan`, {
          seasonId,
          // Backend expects `cropId` (FieldSeasonPlan.cropId). Keep local state name for UI clarity.
          cropId: planCropId,
          sowingDate: sowingDate ? new Date(sowingDate).toISOString() : null,
          status: planStatus,
          cropStatus,
          expectedYield: expectedYield ? expectedYield : null,
          expectedCost: expectedCost ? expectedCost : null,
        });
      }

      // 3) Optional: lease
      if (enableLease && createdFieldId) {
        const rentAmount = String(fd.get("rentAmount") || "").trim();
        const profitSharePctRaw = String(fd.get("profitSharePct") || "").trim();
        const startDate = String(fd.get("leaseStart") || "").trim();
        const endDate = String(fd.get("leaseEnd") || "").trim();
        const notes = String(fd.get("leaseNotes") || "").trim();

        if (!rentAmount || !startDate) {
          throw new Error("Lease requires Rent amount and Start date");
        }

        await api.post("/lease", {
          fieldId: createdFieldId,
          modelType: leaseModel,
          rentAmount,
          profitSharePct:
            leaseModel === "STANDARD"
              ? null
              : profitSharePctRaw
              ? Number(profitSharePctRaw)
              : null,
          startDate,
          endDate: endDate || null,
          notes: notes || null,
        });
      }

      setOk("Field created successfully");
      dispatch(fetchFarmer());
      navigate("/fields/fields-list");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to create field");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Field</h1>
        <p className="text-sm text-gray-600 mt-1">
          Add your land details, optional crop season plan, and optionally post a lease.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Field basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Survey Number
              </label>
              <input
                name="surveyNumber"
                type="number"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Acres
              </label>
              <input
                name="acres"
                type="number"
                step="0.01"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Land Type
              </label>
              <select
                name="landType"
                required
                defaultValue={landTypes[0] ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {landTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Soil Type
              </label>
              <select
                name="soilType"
                required
                defaultValue={soilTypes[0] ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {soilTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Irrigation Type
              </label>
              <select
                name="irrigationType"
                required
                defaultValue={irrigationTypes[0] ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {irrigationTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Region
              </label>
              <input
                name="region"
                placeholder="e.g. Mandya"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-gray-500">
                Land Image (optional)
              </label>
              <input
                name="landImage"
                type="file"
                accept="image/*"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
              />
            </div>
          </div>

          {/* Season plan */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Season Plan (optional)</h2>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enablePlan}
                  onChange={(e) => setEnablePlan(e.target.checked)}
                />
                Enable
              </label>
            </div>

            {enablePlan ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Season</label>
                  <select
                    value={seasonId}
                    onChange={(e) => setSeasonId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Select season
                    </option>
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
                    value={planCropId}
                    onChange={(e) => setPlanCropId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Select crop
                    </option>
                    {crops.map((c) => (
                      <option key={c.cropId} value={c.cropId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Sowing Date (optional)</label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Plan Status</label>
                  <select
                    value={planStatus}
                    onChange={(e) => setPlanStatus(e.target.value as FieldPlanStatus)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  >
                    {planStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Crop Status</label>
                  <select
                    value={cropStatus}
                    onChange={(e) => setCropStatus(e.target.value as CropStatus)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  >
                    {cropStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Expected Yield (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expectedYield}
                    onChange={(e) => setExpectedYield(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                    placeholder="e.g. 1200"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Expected Cost (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expectedCost}
                    onChange={(e) => setExpectedCost(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Lease */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Lease (optional)</h2>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableLease}
                  onChange={(e) => setEnableLease(e.target.checked)}
                />
                Post lease after creating field
              </label>
            </div>

            {enableLease ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Model</label>
                  <select
                    value={leaseModel}
                    onChange={(e) => setLeaseModel(e.target.value as LeaseModelType)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  >
                    {leaseModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Rent Amount (₹)</label>
                  <input
                    name="rentAmount"
                    placeholder="e.g. 25000"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Profit Share (%)</label>
                  <input
                    name="profitSharePct"
                    type="number"
                    min={0}
                    max={100}
                    disabled={leaseModel === "STANDARD"}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">Start Date</label>
                  <input
                    name="leaseStart"
                    type="date"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500">End Date (optional)</label>
                  <input
                    name="leaseEnd"
                    type="date"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-gray-500">Notes (optional)</label>
                  <textarea
                    name="leaseNotes"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {ok ? <p className="text-sm text-green-700">{ok}</p> : null}

          <div className="flex justify-end">
            <button
              disabled={loading}
              className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Field"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateFieldPage;
