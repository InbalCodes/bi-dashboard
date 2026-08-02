import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { buildDigest } from "@/lib/ai/digest";
import { runStructured, ANTI_HALLUCINATION_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { REPORT_SCHEMA, type ReportResult } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const digest = await buildDigest(filters);

  if (digest.totals.leads === 0 && digest.totals.spent === 0) {
    return NextResponse.json({ error: "אין נתונים להצגה עבור הסינון הנוכחי" }, { status: 400 });
  }

  let report: ReportResult;
  try {
    report = await runStructured<ReportResult>({
      system: ANTI_HALLUCINATION_SYSTEM_PROMPT,
      user: `הכן דוח ניהולי על סמך סיכום הנתונים הבא (מסונן לפי בחירת המשתמש):\n\n${JSON.stringify(digest)}`,
      toolName: "submit_report",
      toolDescription: "מחזיר דוח ניהולי מובנה על סמך סיכום הנתונים בלבד",
      inputSchema: REPORT_SCHEMA,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `יצירת הדוח נכשלה: ${message}` }, { status: 502 });
  }

  return NextResponse.json({ report, digest });
}
