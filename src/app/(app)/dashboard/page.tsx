import FilterBar from "@/components/FilterBar";
import KpiCards from "@/components/KpiCards";
import DashboardCharts from "@/components/DashboardCharts";
import { parseFilters } from "@/lib/filters";
import { getMetrics, getCharts, getFilterOptions } from "@/lib/metrics";
import { getPreviousPeriodFilters } from "@/lib/compare";

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
  const filters = parseFilters(urlParams);
  const previousFilters = getPreviousPeriodFilters(filters);

  const [metrics, charts, options, previousMetrics] = await Promise.all([
    getMetrics(filters),
    getCharts(filters),
    getFilterOptions(),
    previousFilters ? getMetrics(previousFilters) : Promise.resolve(null),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">מרכז הבקרה השיווקי</h1>
      <FilterBar options={options} />
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
