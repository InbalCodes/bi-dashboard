import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { buildDigest } from "@/lib/ai/digest";
import { runText } from "@/lib/ai/claude";
import { generateImage } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

const IMAGE_TYPE_LABEL: Record<string, string> = {
  cover: "תמונת שער ממותגת לדוח החודשי",
  summary: "תמונת סיכום ויזואלית של ביצועי החודש",
  campaign_win: "תמונה שיווקית המבוססת על הקמפיין או המוצר עם הביצועים הטובים ביותר",
  achievement: "גרפיקה להצגת הישג מרכזי (כגון גידול בהכנסות או במספר הלידים)",
};

const PROMPT_BUILDER_SYSTEM = `You are an expert at writing prompts for an AI image-generation model (Imagen).
You will receive a compact JSON summary of real business marketing/sales metrics (in Hebrew field values) and a requested image type.
Write ONE short descriptive prompt (2-4 sentences) in English for a professional, abstract/graphic business image that reflects the tone implied by the data (growth, success, or a specific highlighted metric).
Do not include any text, numbers, or Hebrew characters that should appear rendered inside the image itself.
Return ONLY the prompt text, nothing else.`;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);

  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "summary";
  const typeLabel = IMAGE_TYPE_LABEL[type] ?? IMAGE_TYPE_LABEL.summary;

  const digest = await buildDigest(filters);

  const imageContext = {
    totalRevenue: digest.totals.revenue,
    totalSpent: digest.totals.spent,
    roiPct: digest.totals.roiPct,
    totalLeads: digest.totals.leads,
    totalDeals: digest.totals.deals,
    topCampaign: digest.topCampaign,
    topChannel: digest.topChannel,
  };

  try {
    const imagePrompt = await runText({
      system: PROMPT_BUILDER_SYSTEM,
      user: `Requested image type: ${typeLabel}\n\nData summary:\n${JSON.stringify(imageContext)}`,
    });

    const image = await generateImage(imagePrompt);

    return NextResponse.json({
      imageBase64: image.base64,
      mimeType: image.mimeType,
      prompt: imagePrompt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `יצירת התמונה נכשלה: ${message}` }, { status: 502 });
  }
}
