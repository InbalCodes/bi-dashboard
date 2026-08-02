import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// Shared across every AI feature (insights/ask/report): the model receives
// only a structured numeric digest of the currently filtered data (never raw
// rows, never free text) and must answer through a forced tool call, so its
// output always matches our schema instead of loosely-parsed prose.
export const ANTI_HALLUCINATION_SYSTEM_PROMPT = `אתה עוזר אנליטי במערכת BI לשיווק ומכירות.
קיבלת בהודעת המשתמש אך ורק סיכום נתונים מספרי (JSON) שחושב בשרת ישירות מתוך הנתונים האמיתיים המוצגים כרגע במערכת (לאחר הפעלת המסננים שהמשתמש בחר).
כללים מחייבים:
1. כל טענה, מספר, אחוז או מגמה בתשובתך חייבים להתבסס אך ורק על הערכים שמופיעים ב-JSON המצורף. אסור לחשב, להעריך או "לנחש" מספרים שאינם נגזרים ישירות ממנו.
2. מותר להזכיר קמפיין, איש מכירות, ערוץ פרסום, אזור או מוצר רק אם שמו מופיע במפורש בתוך knownEntities שב-JSON. אם אתה לא בטוח שישות מסוימת קיימת שם - אל תזכיר אותה בשם.
3. אם אין מספיק נתונים ב-JSON כדי לענות על שאלה או להסיק מסקנה מסוימת, אמור זאת במפורש במקום להמציא תשובה.
4. עליך להשתמש אך ורק בכלי (tool) שסופק לך כדי להחזיר את התשובה, בהתאם למבנה הנדרש.`;

export async function runStructured<T>(opts: {
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Anthropic.Tool.InputSchema;
}): Promise<T> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.inputSchema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("המודל לא החזיר תשובה מובנית");
  }
  return toolUse.input as T;
}

/** Plain-text completion, used only for building an image-generation prompt (step 7),
 * where a forced tool call isn't needed. */
export async function runText(opts: { system: string; user: string }): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("המודל לא החזיר טקסט");
  }
  return textBlock.text;
}
