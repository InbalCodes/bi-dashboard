import { METRIC_LABELS, CURRENCY_METRICS, type BreachedAlert } from "@/lib/alertTypes";
import { formatCurrency } from "@/lib/format";

function formatValue(metric: keyof typeof METRIC_LABELS, value: number): string {
  return CURRENCY_METRICS.has(metric) ? formatCurrency(value) : `${value.toFixed(1)}%`;
}

export default function AlertBanner({ breached }: { breached: BreachedAlert[] }) {
  if (breached.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
      <h2 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">⚠ התראות סף</h2>
      <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
        {breached.map((b) => (
          <li key={b.id}>
            {METRIC_LABELS[b.metric]} ({formatValue(b.metric, b.currentValue)}) {b.operator === "gt" ? "מעל" : "מתחת ל"}-הסף שהוגדר (
            {formatValue(b.metric, b.threshold)})
            {b.label && ` — ${b.label}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
