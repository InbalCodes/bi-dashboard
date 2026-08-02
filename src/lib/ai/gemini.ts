import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// generateImages()/Imagen is deprecated by Google in favor of generateContent
// with an image-capable Gemini model (see
// https://ai.google.dev/gemini-api/docs/deprecations#imagen-models).
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const genAI = getClient();
  const response = await genAI.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
  });

  const base64 = response.data;
  if (!base64) {
    throw new Error("שירות יצירת התמונות לא החזיר תמונה");
  }

  const inlinePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData);
  const mimeType = inlinePart?.inlineData?.mimeType || "image/png";

  return { base64, mimeType };
}
