import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const parseGoalWithAI = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this goal and suggest a structure: "${prompt}". 
    The metrics should be general human stats (like Strength, Intelligence, Charisma, Endurance, Focus, etc.), not specific game statistics like Elo.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          goalName: { type: Type.STRING },
          description: { type: Type.STRING },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                targetValue: { type: Type.NUMBER },
                initialValue: { type: Type.NUMBER, description: "The starting value for this metric (e.g. current Strength level)" },
                weight: { type: Type.NUMBER }
              }
            }
          },
          habits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                suggestedMetrics: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          resources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                type: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const initializeGoalsWithAI = async (habits: string[], metrics: string[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on these habits: [${habits.join(', ')}] and metrics: [${metrics.join(', ')}], suggest 3-5 high-level goals. 
    For each goal, specify which metrics it should track and what the target values should be.
    Ensure metrics are general human stats (like Strength, Intelligence, Charisma, Endurance, Focus, etc.), not specific game statistics.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metricName: { type: Type.STRING },
                  targetValue: { type: Type.NUMBER },
                  initialValue: { type: Type.NUMBER, description: "The starting value for this metric" },
                  weight: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const buildHabitsWithAI = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on this request: "${prompt}", suggest 3-5 specific habits. 
    For each habit, provide a name, a recommended frequency (daily, weekly, or e.g. 3x/week), and 1-2 metrics it would impact.
    The metrics should be general human stats (like Strength, Intelligence, Charisma, Endurance, Focus, etc.), not specific game statistics.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            frequency: { type: Type.STRING },
            suggestedMetrics: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const suggestCategorization = async (itemName: string, itemType: 'habit' | 'metric' | 'goal', existingCategories: { id: string, name: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Suggest categorization for this ${itemType}: "${itemName}". 
    Existing categories: ${JSON.stringify(existingCategories)}.
    If it fits an existing category, provide its ID. If not, suggest a new category name.
    Also suggest 1-3 metrics this ${itemType} might impact or be related to.
    The metrics should be general human stats (like Strength, Intelligence, Charisma, Endurance, Focus, etc.), not specific game statistics.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          categoryId: { type: Type.STRING, description: "ID of existing category if it fits" },
          newCategoryName: { type: Type.STRING, description: "Name for a new category if no existing fits" },
          suggestedMetrics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Names of 1-3 related metrics"
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const categorizeMultipleHabits = async (habits: { id: string, name: string }[], existingCategories: { id: string, name: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Categorize these habits: ${JSON.stringify(habits)}. 
    Existing categories: ${JSON.stringify(existingCategories)}.
    For each habit, provide its ID and either an existing category ID or a new category name.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            habitId: { type: Type.STRING },
            categoryId: { type: Type.STRING, description: "ID of existing category if it fits" },
            newCategoryName: { type: Type.STRING, description: "Name for a new category if no existing fits" }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const categorizeMultipleResources = async (resources: { id: string, title: string, type: string }[], existingCategories: { id: string, name: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Categorize these resources: ${JSON.stringify(resources)}. 
    Existing categories: ${JSON.stringify(existingCategories)}.
    For each resource, provide its ID and either an existing category ID or a new category name.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            resourceId: { type: Type.STRING },
            categoryId: { type: Type.STRING, description: "ID of existing category if it fits" },
            newCategoryName: { type: Type.STRING, description: "Name for a new category if no existing fits" }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const cleanupResourcesWithAI = async (resources: { id: string, title: string, description: string | null, type: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze this list of resources and determine which ones are the highest quality, most actionable, or most foundational.
    Resources: ${JSON.stringify(resources)}.
    Return a list of resource IDs that should be KEPT. Any ID not in this list will be deleted.
    Keep only the best ~50-70% of resources, removing vague, redundant, or low-value items.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
