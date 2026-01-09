// lib/gemini.js
import { GoogleGenAI } from "@google/genai";

let geminiClient = null;

export function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: "v1",
    });
  }
  return geminiClient;
}
