"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import type { ChartsData } from "@/lib/metrics";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="h-72">{children}</div>
    </div>
  );
}

export default function DashboardCharts({ charts }: { charts: ChartsData }) {
  const funnelData = [
    { name: "לידים", value: charts.funnel.leads, fill: COLORS[0] },
    { name: "פגישות", value: charts.funnel.meetings, fill: COLORS[1] },
    { name: "עסקאות", value: charts.funnel.deals, fill: COLORS[2] },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="הכנסות מול הוצאות לאורך זמן">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.revenueVsSpendOverTime}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="הכנסות" stroke={COLORS[1]} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="spent" name="הוצאות" stroke={COLORS[3]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="מספר לידים לפי ערוץ פרסום">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.leadsByChannel}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="leads" name="לידים" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="אחוזי המרה לפי קמפיין">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.conversionByCampaign} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="campaign" tick={{ fontSize: 10 }} width={140} />
            <Tooltip />
            <Bar dataKey="conversionRate" name="אחוז המרה" fill={COLORS[4]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="משפך מכירות: לידים, פגישות ועסקאות">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList position="right" dataKey="name" fill="currentColor" stroke="none" />
              {funnelData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
