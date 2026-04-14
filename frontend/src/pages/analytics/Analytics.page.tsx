import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import Card from "../../ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type YieldRow = {
  fieldId: string;
  seasonId: string;
  season: { name: string };
  field: { surveyNumber: number; acres: string; region: string | null };
  crop: { name: string };
  expectedYield: number;
  actualYield: number;
  cropStatus: string;
};

const AnalyticsPage = () => {
  const [rows, setRows] = useState<YieldRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/analytics/yield");
        setRows(res.data.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const bySeason = useMemo(() => {
    const map = new Map<
      string,
      { season: string; expected: number; actual: number }
    >();
    for (const r of rows) {
      const key = r.seasonId;
      const cur = map.get(key) ?? {
        season: r.season?.name ?? r.seasonId,
        expected: 0,
        actual: 0,
      };
      cur.expected += r.expectedYield ?? 0;
      cur.actual += r.actualYield ?? 0;
      map.set(key, cur);
    }
    return Array.from(map.values());
  }, [rows]);

  const byField = useMemo(() => {
    const map = new Map<
      string,
      { name: string; expected: number; actual: number }
    >();
    for (const r of rows) {
      const key = r.fieldId;
      const name = `Survey #${r.field?.surveyNumber ?? "-"}`;
      const cur = map.get(key) ?? { name, expected: 0, actual: 0 };
      cur.expected += r.expectedYield ?? 0;
      cur.actual += r.actualYield ?? 0;
      map.set(key, cur);
    }
    return Array.from(map.values());
  }, [rows]);

  const COLORS = {
    expected: "#94a3b8", // slate-400
    actual: "#16a34a", // green-600
  };

  // const seasonColorMap: Record<string, string> = {
  //   KHARIF: "#16a34a", // green
  //   RABI: "#2563eb", // blue
  //   SUMMER: "#ea580c", // orange
  //   WINTER: "#7c3aed", // purple
  // };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">
          Yield analytics and profitability insights
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Yield by Season
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bySeason}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke={COLORS.expected}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={COLORS.actual}
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Yield by Field
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byField}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="expected"
                fill="#cbd5e1" // slate-300
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="actual"
                fill="#16a34a" // green-600
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
