import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { buildDigest, filterToKnownEntities } from "@/lib/ai/digest";
import { runStructured, ANTI_HALLUCINATION_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { ANALYSIS_SCHEMA, type AnalysisResult } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);

  const digest = await buildDigest(filters);

  if (digest.totals.leads === 0 && digest.totals.spent === 0) {
    return NextResponse.json(
      { error: "אין נתונים להצגה עבור הסינון הנוכחי" },
      { status: 400 }
    );
  }

  let result: AnalysisResult;
  try {
    result = await runStructured<AnalysisResult>({
      system: ANTI_HALLUCINATION_SYSTEM_PROMPT,
      user: `נתח את סיכום הנתונים הבא ממערכת ה-BI (הנתונים כבר מסוננים לפי בחירת המשתמש):\n\n${JSON.stringify(digest)}`,
      toolName: "submit_analysis",
      toolDescription: "מחזיר ניתוח ביצועים מובנה על סמך סיכום הנתונים בלבד",
      inputSchema: ANALYSIS_SCHEMA,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `ניתוח ה-AI נכשל: ${message}` }, { status: 502 });
  }

  const campaignsCheck = filterToKnownEntities(digest, result.standoutCampaigns);
  const salespeopleCheck = filterToKnownEntities(digest, result.standoutSalespeople);
  const warnings: string[] = [];
  if (campaignsCheck.droppedCount > 0) {
    warnings.push(`הוסרו ${campaignsCheck.droppedCount} קמפיינים שהמודל הזכיר ולא נמצאו בנתונים המסוננים`);
  }
  if (salespeopleCheck.droppedCount > 0) {
    warnings.push(`הוסרו ${salespeopleCheck.droppedCount} אנשי מכירות שהמודל הזכיר ולא נמצאו בנתונים המסוננים`);
  }

  return NextResponse.json({
    result: {
      ...result,
      standoutCampaigns: campaignsCheck.kept,
      standoutSalespeople: salespeopleCheck.kept,
    },
    warnings,
    digest,
  });
}
