import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const base64ToInlineData = (base64String: string) => {
  const [metadata, data] = base64String.split(',');
  const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

export const suggestCaption = async (images: string[]): Promise<string> => {
  if (!API_KEY) {
    return "API Key not configured. Please set the API_KEY environment variable.";
  }

  try {
    const imageParts = images.map(base64ToInlineData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                ...imageParts,
                { text: "Write a captivating Instagram caption for these images. Include relevant hashtags. The caption should be engaging and encourage interaction." }
            ]
        },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating caption with Gemini API:", error);
    return "Sorry, I couldn't generate a caption right now. Please try again later.";
  }
};