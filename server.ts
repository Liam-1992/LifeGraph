import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODELS = [
  "mistralai/mistral-7b-instruct",
  "nousresearch/nous-hermes-2-mixtral",
  "openchat/openchat-3.5",
  "gryphe/mythomax-l2"
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/coach/chat", async (req, res) => {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured." });
    }

    const { messages, userData } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const systemPrompt = `You are a personal performance optimization coach. You analyze habits, metrics, and trends to suggest practical ways a user can improve their cognitive, physical, emotional, and productivity metrics.

You should:
- give actionable advice
- explain reasoning
- suggest measurable improvements
- avoid giving medical advice. Focus on productivity, fitness habits, mental performance, and learning strategies.

When analyzing user data, structure your response in the following sections:
Analysis
Recommendations
Suggested Habits
Resources

User Data Context:
${userData ? JSON.stringify(userData, null, 2) : "No specific user data provided."}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    let success = false;
    let lastError = null;
    let responseData = null;

    for (const model of MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "LifeGraph AI Coach"
          },
          body: JSON.stringify({
            model: model,
            messages: apiMessages,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        responseData = await response.json();
        success = true;
        break; // Stop trying models if successful
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
        lastError = error;
      }
    }

    if (success && responseData) {
      res.json(responseData);
    } else {
      res.status(500).json({ error: "All AI models failed to respond.", details: lastError?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
