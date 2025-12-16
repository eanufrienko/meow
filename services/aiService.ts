import { GoogleGenAI, Type } from "@google/genai";
import { AILogicResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBehaviorFromText = async (prompt: string): Promise<AILogicResponse | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a JSON configuration for a 3D object behavior based on this request: "${prompt}". 
      
      Available behavior types: 'SPIN' (continuous rotation), 'BOUNCE' (sine wave up/down), 'FLOAT' (slow levitation), 'HOVER' (interactable hover).
      
      Parameters:
      - For SPIN: speed (number, default 1), axis ('x', 'y', or 'z')
      - For BOUNCE: height (number), speed (number)
      - For FLOAT: speed (number)
      
      Return JSON ONLY.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['SPIN', 'BOUNCE', 'FLOAT', 'HOVER'] },
            parameters: {
              type: Type.OBJECT,
              properties: {
                speed: { type: Type.NUMBER },
                axis: { type: Type.STRING },
                height: { type: Type.NUMBER },
              }
            },
            explanation: { type: Type.STRING }
          },
          required: ["type", "explanation"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AILogicResponse;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
