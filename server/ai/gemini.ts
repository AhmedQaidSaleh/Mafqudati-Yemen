import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

// Lazy initialization of Gemini client
let _ai: GoogleGenAI | null = null;
let _cachedKey: string | null = null;

export const getGeminiClient = (): GoogleGenAI | null => {
  const rawKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim();

  // Validate that key exists and is not a placeholder
  if (!apiKey || apiKey === "your-gemini-api-key" || apiKey === "YOUR_GEMINI_API_KEY") {
    return null;
  }

  if (!_ai || _cachedKey !== apiKey) {
    _ai = new GoogleGenAI({ apiKey });
    _cachedKey = apiKey;
  }

  return _ai;
};
