import { getMetrics, getCharts, getEntitiesInScope, type FilterOptions } from "@/lib/metrics";
import type { DashboardFilters } from "@/lib/filters";

export interface Digest {
  filtersApplied: DashboardFilters;
  totals: {
    spent: number;
    revenue: number;
    leads: number;
    deals: number;
    conversionRatePct: number | null;
    avgCostPerLead: number | null;
    avgCostPerDeal: number | null;
    roiPct: number | null;
  };
  topCampaign: { name: string; revenue: number } | null;
  topChannel: { name: string; revenue: number } | null;
  revenueVsSpendOverTime: { date: string; revenue: number; spent: number }[];
  leadsByChannel: { channel: string; leads: number }[];
  conversionByCampaign: { campaign: string; conversionRate: number | null }[];
  revenueBySalesperson: { salesperson: string; revenue: number; leads: number; deals: number; conversionRate: number | null }[];
  performanceByProduct: { product: string; revenue: number; leads: number; deals: number }[];
  budgetVsSpentByMonth: { month: string; budget: number | null; spent: number }[];
  funnel: { leads: number; meetings: number; deals: number };
  /** Entities that actually appear in the currently filtered data — the
   * model's output is validated against this list, never against the full DB. */
  knownEntities: FilterOptions;
}

// Every AI call (analyze/ask/report) is built from exactly this function's
// output. It is never given raw rows or free text — only this structured,
// server-computed summary of what's currently on screen.
export async function buildDigest(filters: DashboardFilters): Promise<Digest> {
  const [metrics, charts, knownEntities] = await Promise.all([
    getMetrics(filters),
    getCharts(filters),
    getEntitiesInScope(filters),
  ]);

  return {
    filtersApplied: filters,
    totals: {
      spent: metrics.totalSpent,
      revenue: metrics.totalRevenue,
      leads: metrics.totalLeads,
      deals: metrics.totalDeals,
      conversionRatePct: metrics.conversionRate,
      avgCostPerLead: metrics.avgCostPerLead,
      avgCostPerDeal: metrics.avgCostPerDeal,
      roiPct: metrics.roi,
    },
    topCampaign: metrics.topCampaign,
    topChannel: metrics.topChannel,
    revenueVsSpendOverTime: charts.revenueVsSpendOverTime,
    leadsByChannel: charts.leadsByChannel,
    conversionByCampaign: charts.conversionByCampaign,
    revenueBySalesperson: charts.revenueBySalesperson,
    performanceByProduct: charts.performanceByProduct,
    budgetVsSpentByMonth: charts.budgetVsSpentByMonth,
    funnel: charts.funnel,
    knownEntities,
  };
}

function allKnownNames(digest: Digest): Set<string> {
  const { campaigns, channels, salespeople, regions, products } = digest.knownEntities;
  return new Set([...campaigns, ...channels, ...salespeople, ...regions, ...products]);
}

/** Drops any {name, ...} item whose name isn't actually present in the
 * currently filtered data, so the model can't invent a campaign/salesperson. */
export function filterToKnownEntities<T extends { name: string }>(
  digest: Digest,
  items: T[]
): { kept: T[]; droppedCount: number } {
  const known = allKnownNames(digest);
  const kept = items.filter((item) => known.has(item.name));
  return { kept, droppedCount: items.length - kept.length };
}
