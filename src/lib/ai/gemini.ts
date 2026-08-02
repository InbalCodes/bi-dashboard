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

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-generate-001";

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const genAI = getClient();
  const response = await genAI.models.generateImages({
    model: IMAGE_MODEL,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "16:9",
    },
  });

  const image = response.generatedImages?.[0]?.image;
  if (!image?.imageBytes) {
    throw new Error("שירות יצירת התמונות לא החזיר תמונה");
  }

  return {
    base64: image.imageBytes,
    mimeType: image.mimeType || "image/png",
  };
}
