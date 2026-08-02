import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

// Called by Vercel Cron (see vercel.json). Not protected by the session cookie
// since cron requests carry no browser session — guarded by CRON_SECRET instead.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runSync();
  if (result.status === "error") {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json(result);
}
