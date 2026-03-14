import { GoogleGenAI } from "@google/genai";

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiCoachService = {
  async sendMessage(messages: AIChatMessage[], userData: any) {
    const lastMessage = messages[messages.length - 1];
    
    const prompt = `
      You are an expert life coach and performance optimizer. 
      Analyze the following user data and provide actionable advice to improve their life, habits, and metrics.
      
      User Data:
      ${JSON.stringify(userData, null, 2)}
      
      User Message:
      ${lastMessage.content}
      
      Please format your response into the following distinct sections using Markdown:
      
      ### Analysis
      [Provide a brief analysis of their current situation based on the data.]
      
      ### Recommendations
      [Provide 3 actionable recommendations as a bulleted list. Clearly present specific metric targets (e.g., "- Increase Focus to 8"). Ensure metrics are general human stats (like Strength, Intelligence, Charisma, Endurance, Focus, etc.), not specific game statistics.]
      
      ### Suggested Habits
      [Suggest habits to focus on as a bulleted list. Clearly present habit frequencies (e.g., "- Meditation: 10 mins daily").]
      
      Explain your reasoning for these suggestions.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "No advice generated.";
  }
};
