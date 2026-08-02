import type { Metrics } from "@/lib/metrics";
import { formatCurrency, formatCurrencyOrDash, formatNumber, formatPercent } from "@/lib/format";
import { pctChange } from "@/lib/compare";

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const change = pctChange(current, previous);
  if (change === null) return null;
  const positive = change >= 0;
  return (
    <span className={`text-xs ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% לעומת התקופה הקודמת
    </span>
  );
}

function Card({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-semibold truncate" title={value}>
        {value}
      </p>
      {delta && <div className="mt-1">{delta}</div>}
    </div>
  );
}

export default function KpiCards({
  metrics,
  previous,
}: {
  metrics: Metrics;
  previous?: Metrics | null;
}) {
  const cards: { label: string; value: string; delta?: React.ReactNode }[] = [
    {
      label: "סך ההוצאות",
      value: formatCurrency(metrics.totalSpent),
      delta: previous && <DeltaBadge current={metrics.totalSpent} previous={previous.totalSpent} />,
    },
    {
      label: "סך ההכנסות",
      value: formatCurrency(metrics.totalRevenue),
      delta: previous && <DeltaBadge current={metrics.totalRevenue} previous={previous.totalRevenue} />,
    },
    {
      label: "מספר הלידים",
      value: formatNumber(metrics.totalLeads),
      delta: previous && <DeltaBadge current={metrics.totalLeads} previous={previous.totalLeads} />,
    },
    {
      label: "מספר העסקאות",
      value: formatNumber(metrics.totalDeals),
      delta: previous && <DeltaBadge current={metrics.totalDeals} previous={previous.totalDeals} />,
    },
    { label: "אחוז המרה מליד לעסקה", value: formatPercent(metrics.conversionRate) },
    { label: "עלות ממוצעת לליד", value: formatCurrencyOrDash(metrics.avgCostPerLead) },
    { label: "עלות ממוצעת לעסקה", value: formatCurrencyOrDash(metrics.avgCostPerDeal) },
    { label: "החזר על ההשקעה (ROI)", value: formatPercent(metrics.roi) },
    { label: "הקמפיין המוביל", value: metrics.topCampaign?.name ?? "—" },
    { label: "ערוץ הפרסום המוביל", value: metrics.topChannel?.name ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => (
        <Card key={card.label} label={card.label} value={card.value} delta={card.delta} />
      ))}
    </div>
  );
}
