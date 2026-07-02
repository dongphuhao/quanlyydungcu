
import { GoogleGenAI } from "@google/genai";
import { MedicalTool, BorrowForm } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Handle both undefined and the literal string "undefined" which can happen with Vite's define
    if (!apiKey || apiKey === "undefined") {
      console.warn("GEMINI_API_KEY is not defined. AI features will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

/**
 * Generates inventory insights using Gemini.
 * Returns a string summary of the inventory status.
 */
export const getInventoryInsights = async (tools: MedicalTool[], borrows: BorrowForm[]): Promise<string> => {
  try {
    const ai = getAi();
    if (!ai) {
      return "Không thể tạo phân tích thông minh do chưa cấu hình API Key. Vui lòng kiểm tra cài đặt hệ thống.";
    }

    const prompt = `
      Analyze the current surgical instrument inventory and usage data.
      Tools: ${JSON.stringify(tools)}
      Active Borrows: ${JSON.stringify(borrows)}
      
      Provide a concise executive summary focusing on:
      1. Low stock alerts
      2. High demand items
      3. Suggested optimization for surgical kits.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text ?? "Không thể tạo phân tích thông minh vào lúc này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể tạo phân tích thông minh vào lúc này.";
  }
};
