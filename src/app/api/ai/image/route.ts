import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/filters";
import { buildDigest } from "@/lib/ai/digest";
import { runText } from "@/lib/ai/claude";
import { generateImage } from "@/lib/ai/gemini";
import { getScopedFilters } from "@/lib/authz";

export const dynamic = "force-dynamic";

const IMAGE_TYPE_BRIEF: Record<string, string> = {
  cover: `A branded cover image for a monthly marketing performance report.
Include a bold English headline built from the actual top-performing channel/campaign name and the ROI or revenue figure (e.g. "GOOGLE SEARCH LEADS Q3" or "452% ROI"), styled as a large hero title.
Background: abstract upward growth charts, data visualization lines, or network/analytics motifs. Corporate, premium look - deep blue/navy with gold or teal accents.`,
  summary: `A visual performance-summary graphic for a marketing dashboard.
Make the single most important number (the ROI percentage or the total revenue figure) the large hero text element in bold English, like a stat callout on a sports broadcast or finance app.
Surround it with supporting abstract chart/graph iconography (bar charts, line graphs, upward arrows) - but the headline number, not the arrow, must be the focal point. Clean modern dashboard aesthetic.`,
  campaign_win: `A marketing "top performer" celebration graphic for one specific winning campaign/channel.
You MUST name the actual winning channel or campaign as bold English text in the image (e.g. if the channel is "Google Search", show a headline like "GOOGLE SEARCH — TOP CHANNEL"; if it's Instagram, LinkedIn, TikTok, YouTube, Facebook, or Email, name that platform explicitly).
Use iconography that visually represents that specific platform (a stylized search/magnifying-glass motif for Google Search, a camera/feed motif for Instagram, a professional network motif for LinkedIn, a play-button motif for TikTok/YouTube, an envelope motif for Email, a social feed motif for Facebook). Do not default to a generic unlabeled arrow with no other context.`,
  achievement: `An achievement/milestone graphic celebrating one concrete, specific number from the data (total revenue, total leads, or ROI - pick the most impressive one).
Show that exact number as large bold English hero text (e.g. "11.3M ILS IN REVENUE" or "9,856 LEADS GENERATED"), combined with a trophy, medal, badge, or podium visual motif to convey achievement. The number must be legible and central, not just decorative arrows.`,
};

const PROMPT_BUILDER_SYSTEM = `You are an expert prompt engineer for an AI image-generation model (Gemini image generation).
You will receive a compact JSON summary of real business marketing/sales metrics and a creative brief for one specific image type.
Write ONE rich, specific image-generation prompt (4-6 sentences) in English that:
1. Follows the creative brief exactly, using the REAL numbers/names from the JSON (translate Hebrew campaign/channel names to their English/Latin parts when present, e.g. "Google Search - גנרי" -> "Google Search").
2. Explicitly specifies what bold English text should appear in the image and where (the brief tells you which number or name to headline) - this is required, the image must not be textless.
3. Specifies concrete visual composition, iconography, and a color palette - avoid vague generic phrases like "abstract business image" or "upward arrow" as the ONLY element.
4. Never includes Hebrew characters as text to be rendered.
5. When a currency amount appears as on-image text, spell it as "ILS" after the number (e.g. "11.3M ILS"), never the ₪ symbol - image models render that glyph incorrectly.
Return ONLY the final image-generation prompt text, nothing else - no preamble, no explanation.`;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = await getScopedFilters(parseFilters(searchParams));

  const body = await request.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "summary";
  const brief = IMAGE_TYPE_BRIEF[type] ?? IMAGE_TYPE_BRIEF.summary;

  const digest = await buildDigest(filters);

  const imageContext = {
    totalRevenueILS: digest.totals.revenue,
    totalSpentILS: digest.totals.spent,
    roiPct: digest.totals.roiPct,
    totalLeads: digest.totals.leads,
    totalDeals: digest.totals.deals,
    conversionRatePct: digest.totals.conversionRatePct,
    topCampaign: digest.topCampaign,
    topChannel: digest.topChannel,
  };

  try {
    const imagePrompt = await runText({
      system: PROMPT_BUILDER_SYSTEM,
      user: `Creative brief:\n${brief}\n\nReal data to use (do not invent numbers or names beyond these):\n${JSON.stringify(imageContext)}`,
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
