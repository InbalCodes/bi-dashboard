export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  campaign?: string;
  channel?: string;
  salesperson?: string;
  region?: string;
  product?: string;
}

export const FILTER_KEYS: (keyof DashboardFilters)[] = [
  "dateFrom",
  "dateTo",
  "campaign",
  "channel",
  "salesperson",
  "region",
  "product",
];

export function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  const filters: DashboardFilters = {};
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  }
  return filters;
}

const COLUMN_BY_FILTER: Record<keyof DashboardFilters, string> = {
  dateFrom: "row_date",
  dateTo: "row_date",
  campaign: "campaign_name",
  channel: "channel",
  salesperson: "salesperson",
  region: "region",
  product: "product",
};

/** Shared WHERE-clause builder so the dashboard, charts, and AI digest all
 * agree on what "the currently displayed data" means. */
export function buildWhereClause(filters: DashboardFilters): { where: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push(`${COLUMN_BY_FILTER.dateFrom} >= $${params.length}`);
  }
  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push(`${COLUMN_BY_FILTER.dateTo} <= $${params.length}`);
  }
  for (const key of ["campaign", "channel", "salesperson", "region", "product"] as const) {
    const value = filters[key];
    if (value) {
      params.push(value);
      conditions.push(`${COLUMN_BY_FILTER[key]} = $${params.length}`);
    }
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
