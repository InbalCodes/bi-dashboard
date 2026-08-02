import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { getCharts } from "@/lib/metrics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const charts = await getCharts(filters);
  return NextResponse.json(charts);
}
