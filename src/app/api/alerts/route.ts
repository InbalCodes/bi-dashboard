import { NextResponse } from "next/server";
import { listAlertRules, createAlertRule } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const rules = await listAlertRules();
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { metric, operator, threshold, label } = body;

  if (typeof metric !== "string" || typeof operator !== "string" || typeof threshold !== "number") {
    return NextResponse.json({ error: "קלט לא תקין" }, { status: 400 });
  }

  try {
    const rule = await createAlertRule({
      metric,
      operator,
      threshold,
      label: typeof label === "string" && label.trim() ? label.trim() : null,
    });
    return NextResponse.json({ rule });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
