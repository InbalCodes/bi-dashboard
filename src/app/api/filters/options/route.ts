import { NextResponse } from "next/server";
import { getFilterOptions } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const options = await getFilterOptions();
  return NextResponse.json(options);
}
