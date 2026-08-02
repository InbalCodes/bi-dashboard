import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { getMetrics } from "@/lib/metrics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const metrics = await getMetrics(filters);
  return NextResponse.json(metrics);
}
