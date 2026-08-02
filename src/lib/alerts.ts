import "server-only";
import { sql } from "./db";
import type { Metrics } from "./metrics";
import { isValidMetric, type AlertRule, type BreachedAlert } from "./alertTypes";

export * from "./alertTypes";

interface AlertRuleRow {
  id: number;
  metric: string;
  operator: string;
  threshold: number;
  label: string | null;
  created_at: string;
}

function mapRow(row: AlertRuleRow): AlertRule {
  return {
    id: row.id,
    metric: row.metric as AlertRule["metric"],
    operator: row.operator as AlertRule["operator"],
    threshold: row.threshold,
    label: row.label,
    createdAt: row.created_at,
  };
}

export async function listAlertRules(): Promise<AlertRule[]> {
  const rows = await sql`
    SELECT id, metric, operator, threshold, label, created_at
    FROM alert_rules
    ORDER BY id DESC
  `;
  return (rows as AlertRuleRow[]).map(mapRow);
}

export async function createAlertRule(input: {
  metric: string;
  operator: string;
  threshold: number;
  label?: string | null;
}): Promise<AlertRule> {
  if (!isValidMetric(input.metric)) throw new Error("מדד לא תקין");
  if (input.operator !== "gt" && input.operator !== "lt") throw new Error("תנאי לא תקין");
  if (!Number.isFinite(input.threshold)) throw new Error("ערך סף לא תקין");

  const rows = await sql`
    INSERT INTO alert_rules (metric, operator, threshold, label)
    VALUES (${input.metric}, ${input.operator}, ${input.threshold}, ${input.label ?? null})
    RETURNING id, metric, operator, threshold, label, created_at
  `;
  return mapRow(rows[0] as AlertRuleRow);
}

export async function deleteAlertRule(id: number): Promise<void> {
  await sql`DELETE FROM alert_rules WHERE id = ${id}`;
}

/** Compares each rule against the metrics currently on screen (already
 * filtered/scoped) - an alert only fires for what the viewer is looking at. */
export function evaluateAlerts(rules: AlertRule[], metrics: Metrics): BreachedAlert[] {
  const breached: BreachedAlert[] = [];
  for (const rule of rules) {
    const value = metrics[rule.metric];
    if (typeof value !== "number") continue; // e.g. roi/conversionRate can be null
    const isBreached = rule.operator === "gt" ? value > rule.threshold : value < rule.threshold;
    if (isBreached) breached.push({ ...rule, currentValue: value });
  }
  return breached;
}
