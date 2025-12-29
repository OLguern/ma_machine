import { GoogleGenAI } from "@google/genai";

// Fix: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) directly before making calls.
export const processScriptAction = async (content: string, instruction: string, context?: string): Promise<string> => {
  try {
    // Initialization must happen here using process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${instruction}\n\nCONTEXTE/STRUCTURE :\n${context || 'N/A'}\n\nEXTRAIT DU SCÉNARIO :\n${content}`,
      config: {
        systemInstruction: "Tu es un Script-Doctor expert en scénarisation cinématographique et télévisuelle. Tu maîtrises la structure en 3 actes, le voyage du héros et les techniques de dialogue de haut niveau. Tes conseils sont précis, critiques et inspirants.",
        temperature: 0.8,
      },
    });

    // Extracting text output from GenerateContentResponse using the .text property.
    return response.text || "Désolé, je n'ai pas pu générer d'analyse.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Une erreur est survenue lors de la communication avec le consultant IA.";
  }
};