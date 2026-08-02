import type { DashboardFilters } from "./filters";

/** Previous period of equal length, immediately preceding the selected date
 * range. Returns null when no date range is selected (comparison needs a
 * defined period length). */
export function getPreviousPeriodFilters(filters: DashboardFilters): DashboardFilters | null {
  if (!filters.dateFrom || !filters.dateTo) return null;

  const from = new Date(filters.dateFrom);
  const to = new Date(filters.dateTo);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return null;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const lengthMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - DAY_MS);
  const prevFrom = new Date(prevTo.getTime() - lengthMs);

  return {
    ...filters,
    dateFrom: prevFrom.toISOString().slice(0, 10),
    dateTo: prevTo.toISOString().slice(0, 10),
  };
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
