import FilterBar from "@/components/FilterBar";
import KpiCards from "@/components/KpiCards";
import DashboardCharts from "@/components/DashboardCharts";
import AlertBanner from "@/components/AlertBanner";
import { parseFilters } from "@/lib/filters";
import { getMetrics, getCharts } from "@/lib/metrics";
import { getPreviousPeriodFilters } from "@/lib/compare";
import { getSession } from "@/lib/auth";
import { applyRoleScope, getFilterOptionsForSession } from "@/lib/authz";
import { listAlertRules, evaluateAlerts } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string") urlParams.set(key, value);
  }
  const session = await getSession();
  const filters = applyRoleScope(parseFilters(urlParams), session);
  const previousFilters = getPreviousPeriodFilters(filters);
  const lockedSalesperson = session?.role === "salesperson" ? session.salesperson ?? undefined : undefined;

  const [metrics, charts, options, previousMetrics, alertRules] = await Promise.all([
    getMetrics(filters),
    getCharts(filters),
    getFilterOptionsForSession(),
    previousFilters ? getMetrics(previousFilters) : Promise.resolve(null),
    listAlertRules(),
  ]);
  const breachedAlerts = evaluateAlerts(alertRules, metrics);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">מרכז הבקרה השיווקי</h1>
      <AlertBanner breached={breachedAlerts} />
      <FilterBar options={options} lockedSalesperson={lockedSalesperson} />
      {!previousFilters && (
        <p className="text-xs text-slate-400 mb-3">
          בחרו טווח תאריכים (מתאריך ועד תאריך) כדי לראות השוואה לתקופה הקודמת באותו אורך.
        </p>
      )}
      {previousFilters && (
        <p className="text-xs text-slate-400 mb-3">
          משווה לתקופה הקודמת: {previousFilters.dateFrom} עד {previousFilters.dateTo}
        </p>
      )}
      <KpiCards metrics={metrics} previous={previousMetrics} />
      <DashboardCharts charts={charts} />
    </div>
  );
}
