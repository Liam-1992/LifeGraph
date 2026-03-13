export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export const aiCoachService = {
  async sendMessage(messages: AIChatMessage[], userData: any): Promise<string> {
    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          userData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data: AIResponse = await response.json();
      return data.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      console.error("AI Coach Error:", error);
      throw error;
    }
  }
};
