import React, { useMemo } from "react";
import Card from "../../ui/Card";

type Plan = {
  planId: string;
  status?: string;
  cropStatus?: string;
  sowingDate?: string | null;
  expectedEndDate?: string | null;
  crop?: { name?: string } | null;
  season?: { name?: string } | null;
};

type Field = {
  fieldId: string;
  surveyNumber?: number | string;
  plans?: Plan[];
  fieldSeasonPlan?: Plan[];
};

const toDateKey = (d: Date) => d.toISOString().slice(0, 10);
const safeUpper = (v: any) => String(v ?? "").toUpperCase();

const TodayTasks: React.FC<{ fields: Field[] }> = ({ fields }) => {
  const { today, upcoming, overdue } = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const in7 = new Date(now);
    in7.setDate(in7.getDate() + 7);

    const allPlans: Array<{ field: Field; plan: Plan }> = [];
    for (const f of fields ?? []) {
      const plans = (f.plans ?? (f as any).fieldSeasonPlan ?? []) as Plan[];
      for (const p of plans ?? []) allPlans.push({ field: f, plan: p });
    }

    const ended = (p: Plan) => {
      const ps = safeUpper(p.status);
      const cs = safeUpper(p.cropStatus);
      return ps === "COMPLETED" || cs === "HARVESTED" || cs === "DAMAGED";
    };

    const parse = (v?: string | null) => (v ? new Date(v) : null);

    const todayTasks: any[] = [];
    const upcomingTasks: any[] = [];
    const overdueTasks: any[] = [];

    for (const { field, plan } of allPlans) {
      if (ended(plan)) continue;

      const sow = parse(plan.sowingDate);
      const end = parse(plan.expectedEndDate);
      const cs = safeUpper(plan.cropStatus);
      const ps = safeUpper(plan.status);

      const fieldLabel = field.surveyNumber ? `Survey #${field.surveyNumber}` : `Field ${field.fieldId.slice(-4)}`;
      const cropName = plan.crop?.name ?? "Crop";
      const seasonName = plan.season?.name ?? "Season";

      // 1) Sowing today
      if (sow && toDateKey(sow) === todayKey) {
        todayTasks.push({
          title: `Sow ${cropName}`,
          meta: `${fieldLabel} • ${seasonName}`,
          hint: ps === "PLANNED" ? "Mark plan ACTIVE after sowing" : "" ,
        });
      }

      // 2) Harvest ready
      if (cs === "HARVEST_READY") {
        todayTasks.push({
          title: `Harvest ${cropName}`,
          meta: `${fieldLabel} • ${seasonName}`,
          hint: "Update Crop Status to HARVESTED and fill Actual Yield",
        });
      }

      // 3) Expected end date approaching / overdue
      if (end) {
        if (end < now) {
          overdueTasks.push({
            title: `Overdue: ${cropName} end date passed`,
            meta: `${fieldLabel} • expected ${toDateKey(end)} • ${seasonName}`,
            hint: "Update expectedEndDate or complete the plan",
          });
        } else if (end <= in7) {
          upcomingTasks.push({
            title: `Upcoming: ${cropName} nearing harvest`,
            meta: `${fieldLabel} • expected ${toDateKey(end)} • ${seasonName}`,
            hint: "Prepare harvest / inputs",
          });
        }
      }

      // 4) Planned but sowing date in the past
      if (ps === "PLANNED" && sow && sow < now && toDateKey(sow) !== todayKey) {
        overdueTasks.push({
          title: `Planned plan not started`,
          meta: `${fieldLabel} • ${cropName} • sowing ${toDateKey(sow)}`,
          hint: "Edit plan dates or set status ACTIVE",
        });
      }
    }

    // keep lists short + relevant
    return {
      today: todayTasks.slice(0, 6),
      upcoming: upcomingTasks.slice(0, 6),
      overdue: overdueTasks.slice(0, 6),
    };
  }, [fields]);

  const Empty = ({ label }: { label: string }) => (
    <p className="text-sm text-gray-400">No {label} tasks</p>
  );

  const TaskList = ({ items }: { items: any[] }) => (
    <ul className="mt-3 space-y-3">
      {items.map((t, idx) => (
        <li key={idx} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="text-sm font-semibold text-gray-900">{t.title}</div>
          <div className="text-xs text-gray-600 mt-1">{t.meta}</div>
          {t.hint ? <div className="text-xs text-gray-500 mt-1">{t.hint}</div> : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="h-full">
        <h2 className="font-semibold text-gray-900">Today’s Tasks</h2>
        {today.length ? <TaskList items={today} /> : <Empty label="today" />}
      </Card>

      <Card className="h-full">
        <h2 className="font-semibold text-gray-900">Upcoming (7 days)</h2>
        {upcoming.length ? <TaskList items={upcoming} /> : <Empty label="upcoming" />}
      </Card>

      <Card className="h-full">
        <h2 className="font-semibold text-gray-900">Needs Attention</h2>
        {overdue.length ? <TaskList items={overdue} /> : <Empty label="attention" />}
      </Card>
    </div>
  );
};

export default TodayTasks;
