import { getSession, type Session } from "./auth";
import { getFilterOptions, getEntitiesInScope, type FilterOptions } from "./metrics";
import type { DashboardFilters } from "./filters";

/** A salesperson session always sees only their own data, regardless of what
 * filters the client sends - never trust the client for this, it's the
 * server that enforces the scope on every read. */
export function applyRoleScope(filters: DashboardFilters, session: Session | null): DashboardFilters {
  if (session?.role === "salesperson" && session.salesperson) {
    return { ...filters, salesperson: session.salesperson };
  }
  return filters;
}

export async function getScopedFilters(filters: DashboardFilters): Promise<DashboardFilters> {
  const session = await getSession();
  return applyRoleScope(filters, session);
}

/** Filter-dropdown option lists: a manager sees every value in the table
 * (unscoped, so any filter combination is explorable); a salesperson only
 * ever sees the campaigns/channels/regions/products that appear in their
 * own data. */
export async function getFilterOptionsForSession(): Promise<FilterOptions> {
  const session = await getSession();
  if (session?.role === "salesperson" && session.salesperson) {
    return getEntitiesInScope({ salesperson: session.salesperson });
  }
  return getFilterOptions();
}
