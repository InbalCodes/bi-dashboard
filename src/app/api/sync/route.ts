import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export async function POST() {
  const result = await runSync();

  if (result.status === "error") {
    return NextResponse.json(
      { error: result.error ?? "הסנכרון נכשל" },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
