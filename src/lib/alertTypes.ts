// Client-safe types/constants only - no DB import here. Client components
// (AlertRulesPanel) import from this file directly, never from lib/alerts.ts,
// so the Postgres client never gets pulled into the browser bundle.

export type AlertMetric =
  | "totalSpent"
  | "totalRevenue"
  | "roi"
  | "conversionRate"
  | "avgCostPerLead"
  | "avgCostPerDeal";

export type AlertOperator = "gt" | "lt";

export const METRIC_LABELS: Record<AlertMetric, string> = {
  totalSpent: "סך ההוצאות",
  totalRevenue: "סך ההכנסות",
  roi: "החזר על ההשקעה (ROI)",
  conversionRate: "אחוז המרה מליד לעסקה",
  avgCostPerLead: "עלות ממוצעת לליד",
  avgCostPerDeal: "עלות ממוצעת לעסקה",
};

const VALID_METRICS = Object.keys(METRIC_LABELS) as AlertMetric[];

/** Metrics measured in ILS vs. percentages - drives how values are formatted for display. */
export const CURRENCY_METRICS = new Set<AlertMetric>(["totalSpent", "totalRevenue", "avgCostPerLead", "avgCostPerDeal"]);

export function isValidMetric(metric: string): metric is AlertMetric {
  return VALID_METRICS.includes(metric as AlertMetric);
}

export interface AlertRule {
  id: number;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  label: string | null;
  createdAt: string;
}

export interface BreachedAlert extends AlertRule {
  currentValue: number;
}
