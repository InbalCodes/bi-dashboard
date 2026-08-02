import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { getCharts } from "@/lib/metrics";
import { getScopedFilters } from "@/lib/authz";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = await getScopedFilters(parseFilters(searchParams));
  const charts = await getCharts(filters);
  return NextResponse.json(charts);
}
