import type Anthropic from "@anthropic-ai/sdk";

export interface AnalysisResult {
  summary: string;
  insights: { text: string; basedOn: string[] }[];
  trends: { direction: "positive" | "negative" | "neutral"; description: string }[];
  anomalies: string[];
  standoutCampaigns: { name: string; reason: string }[];
  standoutSalespeople: { name: string; reason: string }[];
  recommendations: string[];
  pointsToInvestigate: string[];
}

export const ANALYSIS_SCHEMA: Anthropic.Tool.InputSchema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "סיכום ביצועים ניהולי, 2-4 משפטים" },
    insights: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      description: "בדיוק שלוש תובנות מרכזיות",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          basedOn: {
            type: "array",
            items: { type: "string" },
            description: "אילו שדות/מדדים מה-JSON התובנה מתבססת עליהם, למשל ROI או קמפיין מוביל",
          },
        },
        required: ["text", "basedOn"],
      },
    },
    trends: {
      type: "array",
      description: "מגמות חיוביות או שליליות שזוהו",
      items: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["positive", "negative", "neutral"] },
          description: { type: "string" },
        },
        required: ["direction", "description"],
      },
    },
    anomalies: {
      type: "array",
      items: { type: "string" },
      description: "נתונים חריגים שזוהו בנתונים",
    },
    standoutCampaigns: {
      type: "array",
      description: "קמפיינים עם ביצועים חריגים (טובים או גרועים) - רק שמות שמופיעים ב-knownEntities.campaigns",
      items: {
        type: "object",
        properties: { name: { type: "string" }, reason: { type: "string" } },
        required: ["name", "reason"],
      },
    },
    standoutSalespeople: {
      type: "array",
      description: "אנשי מכירות עם ביצועים חריגים - רק שמות שמופיעים ב-knownEntities.salespeople",
      items: {
        type: "object",
        properties: { name: { type: "string" }, reason: { type: "string" } },
        required: ["name", "reason"],
      },
    },
    recommendations: { type: "array", items: { type: "string" }, description: "המלצות לפעולות המשך" },
    pointsToInvestigate: { type: "array", items: { type: "string" }, description: "נקודות שכדאי לבדוק לעומק" },
  },
  required: [
    "summary",
    "insights",
    "trends",
    "anomalies",
    "standoutCampaigns",
    "standoutSalespeople",
    "recommendations",
    "pointsToInvestigate",
  ],
};

export interface AskResult {
  answer: string;
  basedOn: string[];
  hasEnoughData: boolean;
}

export const ASK_SCHEMA: Anthropic.Tool.InputSchema = {
  type: "object",
  properties: {
    answer: { type: "string", description: "תשובה ברורה וממוקדת לשאלת המשתמש, בעברית" },
    basedOn: {
      type: "array",
      items: { type: "string" },
      description: "אילו שדות/מדדים מה-JSON התשובה מתבססת עליהם",
    },
    hasEnoughData: {
      type: "boolean",
      description: "false אם אין מספיק נתונים ב-JSON כדי לענות בביטחון על השאלה",
    },
  },
  required: ["answer", "basedOn", "hasEnoughData"],
};

export interface ReportResult {
  periodLabel: string;
  summary: string;
  insights: string[];
  anomalies: string[];
  recommendations: string[];
}

export const REPORT_SCHEMA: Anthropic.Tool.InputSchema = {
  type: "object",
  properties: {
    periodLabel: { type: "string", description: "תיאור קצר של תקופת הדוח בעברית" },
    summary: { type: "string", description: "סיכום ביצועים ניהולי מלא, פסקה אחת עד שתיים" },
    insights: { type: "array", items: { type: "string" }, description: "תובנות מרכזיות" },
    anomalies: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["periodLabel", "summary", "insights", "anomalies", "recommendations"],
};
