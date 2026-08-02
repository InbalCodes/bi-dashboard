"use client";

import { useState } from "react";
import { METRIC_LABELS, CURRENCY_METRICS, type AlertRule, type AlertMetric, type AlertOperator } from "@/lib/alertTypes";
import { formatCurrency } from "@/lib/format";

function formatThreshold(metric: AlertMetric, value: number): string {
  return CURRENCY_METRICS.has(metric) ? formatCurrency(value) : `${value}%`;
}

export default function AlertRulesPanel({ initialRules }: { initialRules: AlertRule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [metric, setMetric] = useState<AlertMetric>("roi");
  const [operator, setOperator] = useState<AlertOperator>("lt");
  const [threshold, setThreshold] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    const numericThreshold = Number(threshold);
    if (!Number.isFinite(numericThreshold)) {
      setError("יש להזין ערך סף תקין");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metric, operator, threshold: numericThreshold, label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "הוספת הכלל נכשלה");
        return;
      }
      setRules((r) => [data.rule, ...r]);
      setThreshold("");
      setLabel("");
    } catch {
      setError("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }

  async function removeRule(id: number) {
    setRules((r) => r.filter((rule) => rule.id !== id));
    await fetch(`/api/alerts/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-slate-500 mb-3">התראות סף</h2>
      <p className="text-xs text-slate-400 mb-4">
        כאשר מדד בדשבורד (לפי הסינון הנוכחי) חורג מהסף שהוגדר, תוצג התראה בראש הדשבורד.
      </p>

      <form onSubmit={addRule} className="flex flex-wrap items-end gap-2 mb-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">מדד</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as AlertMetric)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm"
          >
            {Object.entries(METRIC_LABELS).map(([key, l]) => (
              <option key={key} value={key}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">תנאי</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as AlertOperator)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm"
          >
            <option value="lt">מתחת ל-</option>
            <option value="gt">מעל</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">ערך סף</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
            className="w-28 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-xs text-slate-500 mb-1">תיאור (אופציונלי)</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="לדוגמה: תקציב Q3"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          הוסף כלל
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {rules.length === 0 ? (
        <p className="text-sm text-slate-400">לא הוגדרו כללי התראה.</p>
      ) : (
        <ul className="space-y-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2"
            >
              <span>
                {METRIC_LABELS[rule.metric]} {rule.operator === "gt" ? "מעל" : "מתחת ל-"}{" "}
                {formatThreshold(rule.metric, rule.threshold)}
                {rule.label && <span className="text-slate-400"> — {rule.label}</span>}
              </span>
              <button
                onClick={() => removeRule(rule.id)}
                className="text-red-600 hover:underline text-xs"
              >
                מחק
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
