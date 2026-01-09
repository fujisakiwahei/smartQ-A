import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with a function to allow runtime key injection or mocking
export const useGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
};
