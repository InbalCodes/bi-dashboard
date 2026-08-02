import { NextResponse } from "next/server";
import { getFilterOptionsForSession } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const options = await getFilterOptionsForSession();
  return NextResponse.json(options);
}
