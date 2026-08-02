import { sql } from "./db";
import { buildWhereClause, type DashboardFilters } from "./filters";

export interface Metrics {
  totalSpent: number;
  totalRevenue: number;
  totalLeads: number;
  totalDeals: number;
  conversionRate: number | null; // deals / leads * 100
  avgCostPerLead: number | null; // spent / leads
  avgCostPerDeal: number | null; // spent / deals
  roi: number | null; // (revenue - spent) / spent * 100
  topCampaign: { name: string; revenue: number } | null;
  topChannel: { name: string; revenue: number } | null;
}

function divideOrNull(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export async function getMetrics(filters: DashboardFilters): Promise<Metrics> {
  const { where, params } = buildWhereClause(filters);

  const totalsQuery = `
    SELECT
      COALESCE(SUM(spent), 0)::float AS total_spent,
      COALESCE(SUM(revenue), 0)::float AS total_revenue,
      COALESCE(SUM(leads), 0)::float AS total_leads,
      COALESCE(SUM(deals), 0)::float AS total_deals
    FROM marketing_rows
    ${where}
  `;
  const topCampaignQuery = `
    SELECT campaign_name AS name, SUM(revenue)::float AS revenue
    FROM marketing_rows
    ${where}
    GROUP BY campaign_name
    ORDER BY revenue DESC
    LIMIT 1
  `;
  const topChannelQuery = `
    SELECT channel AS name, SUM(revenue)::float AS revenue
    FROM marketing_rows
    ${where}
    GROUP BY channel
    ORDER BY revenue DESC
    LIMIT 1
  `;

  const [totalsRows, topCampaignRows, topChannelRows] = await Promise.all([
    sql.query(totalsQuery, params),
    sql.query(topCampaignQuery, params),
    sql.query(topChannelQuery, params),
  ]);

  const totals = totalsRows[0] as
    | { total_spent: number; total_revenue: number; total_leads: number; total_deals: number }
    | undefined;

  const totalSpent = totals?.total_spent ?? 0;
  const totalRevenue = totals?.total_revenue ?? 0;
  const totalLeads = totals?.total_leads ?? 0;
  const totalDeals = totals?.total_deals ?? 0;

  const topCampaign = topCampaignRows[0] as { name: string; revenue: number } | undefined;
  const topChannel = topChannelRows[0] as { name: string; revenue: number } | undefined;

  return {
    totalSpent,
    totalRevenue,
    totalLeads,
    totalDeals,
    conversionRate: divideOrNull(totalDeals * 100, totalLeads),
    avgCostPerLead: divideOrNull(totalSpent, totalLeads),
    avgCostPerDeal: divideOrNull(totalSpent, totalDeals),
    roi: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : null,
    topCampaign: topCampaign ?? null,
    topChannel: topChannel ?? null,
  };
}

export interface ChartsData {
  revenueVsSpendOverTime: { date: string; revenue: number; spent: number }[];
  leadsByChannel: { channel: string; leads: number }[];
  conversionByCampaign: { campaign: string; conversionRate: number | null }[];
  revenueBySalesperson: { salesperson: string; revenue: number; leads: number; deals: number; conversionRate: number | null }[];
  performanceByProduct: { product: string; revenue: number; leads: number; deals: number }[];
  /** Budget vs. actual spend by month. Budget is intentionally missing on
   * some rows (per the data dictionary) - SUM() ignores those NULLs rather
   * than treating them as zero, so this compares like-for-like. */
  budgetVsSpentByMonth: { month: string; budget: number | null; spent: number }[];
  funnel: { leads: number; meetings: number; deals: number };
}

export async function getCharts(filters: DashboardFilters): Promise<ChartsData> {
  const { where, params } = buildWhereClause(filters);

  const overTimeQuery = `
    SELECT row_date::text AS date, SUM(revenue)::float AS revenue, SUM(spent)::float AS spent
    FROM marketing_rows
    ${where}
    GROUP BY row_date
    ORDER BY row_date ASC
  `;
  const byChannelQuery = `
    SELECT channel, SUM(leads)::float AS leads
    FROM marketing_rows
    ${where}
    GROUP BY channel
    ORDER BY leads DESC
  `;
  const byCampaignQuery = `
    SELECT campaign_name AS campaign, SUM(leads)::float AS leads, SUM(deals)::float AS deals
    FROM marketing_rows
    ${where}
    GROUP BY campaign_name
    ORDER BY campaign_name ASC
  `;
  const bySalespersonQuery = `
    SELECT salesperson, SUM(revenue)::float AS revenue, SUM(leads)::float AS leads, SUM(deals)::float AS deals
    FROM marketing_rows
    ${where}
    GROUP BY salesperson
    ORDER BY revenue DESC
  `;
  const byProductQuery = `
    SELECT product, SUM(revenue)::float AS revenue, SUM(leads)::float AS leads, SUM(deals)::float AS deals
    FROM marketing_rows
    ${where}
    GROUP BY product
    ORDER BY revenue DESC
  `;
  const budgetVsSpentQuery = `
    SELECT
      to_char(date_trunc('month', row_date), 'YYYY-MM') AS month,
      SUM(budget)::float AS budget,
      SUM(spent)::float AS spent
    FROM marketing_rows
    ${where}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  const funnelQuery = `
    SELECT
      COALESCE(SUM(leads), 0)::float AS leads,
      COALESCE(SUM(meetings), 0)::float AS meetings,
      COALESCE(SUM(deals), 0)::float AS deals
    FROM marketing_rows
    ${where}
  `;

  const [overTimeRows, byChannelRows, byCampaignRows, bySalespersonRows, byProductRows, budgetVsSpentRows, funnelRows] =
    await Promise.all([
      sql.query(overTimeQuery, params),
      sql.query(byChannelQuery, params),
      sql.query(byCampaignQuery, params),
      sql.query(bySalespersonQuery, params),
      sql.query(byProductQuery, params),
      sql.query(budgetVsSpentQuery, params),
      sql.query(funnelQuery, params),
    ]);

  const funnel = (funnelRows[0] as { leads: number; meetings: number; deals: number } | undefined) ?? {
    leads: 0,
    meetings: 0,
    deals: 0,
  };

  return {
    revenueVsSpendOverTime: overTimeRows as { date: string; revenue: number; spent: number }[],
    leadsByChannel: byChannelRows as { channel: string; leads: number }[],
    conversionByCampaign: (byCampaignRows as { campaign: string; leads: number; deals: number }[]).map(
      (r) => ({
        campaign: r.campaign,
        conversionRate: divideOrNull(r.deals * 100, r.leads),
      })
    ),
    revenueBySalesperson: (
      bySalespersonRows as { salesperson: string; revenue: number; leads: number; deals: number }[]
    ).map((r) => ({
      salesperson: r.salesperson,
      revenue: r.revenue,
      leads: r.leads,
      deals: r.deals,
      conversionRate: divideOrNull(r.deals * 100, r.leads),
    })),
    performanceByProduct: byProductRows as { product: string; revenue: number; leads: number; deals: number }[],
    budgetVsSpentByMonth: budgetVsSpentRows as { month: string; budget: number | null; spent: number }[],
    funnel,
  };
}

export interface FilterOptions {
  campaigns: string[];
  channels: string[];
  salespeople: string[];
  regions: string[];
  products: string[];
}

/** Like getFilterOptions, but scoped to the given filters — used to validate
 * that AI-mentioned entity names actually appear in the data currently in view. */
export async function getEntitiesInScope(filters: DashboardFilters): Promise<FilterOptions> {
  const { where, params } = buildWhereClause(filters);
  const [campaigns, channels, salespeople, regions, products] = await Promise.all([
    sql.query(`SELECT DISTINCT campaign_name AS v FROM marketing_rows ${where} ORDER BY v`, params),
    sql.query(`SELECT DISTINCT channel AS v FROM marketing_rows ${where} ORDER BY v`, params),
    sql.query(`SELECT DISTINCT salesperson AS v FROM marketing_rows ${where} ORDER BY v`, params),
    sql.query(
      `SELECT DISTINCT region AS v FROM marketing_rows ${where ? `${where} AND` : "WHERE"} region IS NOT NULL ORDER BY v`,
      params
    ),
    sql.query(`SELECT DISTINCT product AS v FROM marketing_rows ${where} ORDER BY v`, params),
  ]);

  const pluck = (rows: { v: string }[]) => rows.map((r) => r.v);

  return {
    campaigns: pluck(campaigns as { v: string }[]),
    channels: pluck(channels as { v: string }[]),
    salespeople: pluck(salespeople as { v: string }[]),
    regions: pluck(regions as { v: string }[]),
    products: pluck(products as { v: string }[]),
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [campaigns, channels, salespeople, regions, products] = await Promise.all([
    sql`SELECT DISTINCT campaign_name AS v FROM marketing_rows ORDER BY v`,
    sql`SELECT DISTINCT channel AS v FROM marketing_rows ORDER BY v`,
    sql`SELECT DISTINCT salesperson AS v FROM marketing_rows ORDER BY v`,
    sql`SELECT DISTINCT region AS v FROM marketing_rows WHERE region IS NOT NULL ORDER BY v`,
    sql`SELECT DISTINCT product AS v FROM marketing_rows ORDER BY v`,
  ]);

  const pluck = (rows: { v: string }[]) => rows.map((r) => r.v);

  return {
    campaigns: pluck(campaigns as { v: string }[]),
    channels: pluck(channels as { v: string }[]),
    salespeople: pluck(salespeople as { v: string }[]),
    regions: pluck(regions as { v: string }[]),
    products: pluck(products as { v: string }[]),
  };
}
