import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { buildDigest } from "@/lib/ai/digest";
import { runStructured, ANTI_HALLUCINATION_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { ASK_SCHEMA, isValidAskResult, type AskResult } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);

  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "יש להזין שאלה" }, { status: 400 });
  }

  const digest = await buildDigest(filters);

  let result: AskResult;
  try {
    result = await runStructured<AskResult>({
      system: ANTI_HALLUCINATION_SYSTEM_PROMPT,
      user: `שאלת המשתמש: "${question}"\n\nסיכום הנתונים הזמין לענות עליה (מסונן לפי בחירת המשתמש):\n\n${JSON.stringify(digest)}`,
      toolName: "submit_answer",
      toolDescription: "מחזיר תשובה מובנית לשאלה על סמך סיכום הנתונים בלבד",
      inputSchema: ASK_SCHEMA,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `השאלה נכשלה: ${message}` }, { status: 502 });
  }

  if (!isValidAskResult(result)) {
    console.error("Invalid ask result shape:", JSON.stringify(result));
    return NextResponse.json(
      { error: "תשובת ה-AI התקבלה בפורמט לא תקין, נסו שוב" },
      { status: 502 }
    );
  }

  return NextResponse.json({ result, digest });
}
