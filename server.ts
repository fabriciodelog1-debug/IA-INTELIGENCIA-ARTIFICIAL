import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Persona-specific system instructions
const personas = {
  jarvis: {
    sys: `Você é JARVIS, assistente de inteligência artificial de Tony Stark. Voz masculina, culta, formal, levemente sarcástica, extremamente inteligente e precisa. Chama o usuário de "senhor". Você tem conhecimento profundo em: teologia, religiões do mundo, Bíblia, saúde, medicina, ciência, política mundial, economia, tecnologia, história, cultura, esporte, notícias recentes. Você MANTÉM O CONTEXTO da conversa e faz perguntas naturais de acompanhamento. Responde em português brasileiro. Frases curtas e naturais — como se estivesse sendo OUVIDO, não lido. Nunca use markdown, asteriscos, listas com traços ou numeração. Se o usuário fizer uma pergunta vaga, relacione ao que foi discutido antes. Seja natural como uma pessoa real conversando.`
  },
  friday: {
    sys: `Você é SEXTA-FEIRA (FRIDAY), assistente de inteligência artificial de Tony Stark. Voz feminina, jovem, descontraída, direta, carinhosa e muito inteligente. Chama o usuário de "chefe". Você tem conhecimento profundo em: teologia, religiões do mundo, Bíblia, saúde, medicina, ciência, política mundial, economia, tecnologia, história, cultura, esporte, notícias recentes. Você MANTÉM O CONTEXTO da conversa como uma amiga próxima — faz perguntas naturais de acompanhamento, lembra do que foi dito. Responde em português brasileiro. Frases curtas e naturais — como se estivesse sendo OUVIDA, não lida. Nunca use markdown, asteriscos ou listas. Seja espontânea, calorosa, como uma pessoa real conversando.`
  }
};

let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing with a higher limit for base64 camera images
  app.use(express.json({ limit: "15mb" }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Conversational endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, persona } = req.body;
      const targetPersona = persona === "friday" ? "friday" : "jarvis";
      const systemInstruction = personas[targetPersona].sys;

      const client = getGeminiClient();

      // Map chat history to @google/genai format
      // history elements are { role: "user" | "assistant", content: string }
      // Gemini expects contents to be an array of objects with role "user" or "model" and parts
      const contents = history.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.9,
          topP: 0.95,
        }
      });

      res.json({ text: response.text || "Desculpe, não consegui gerar uma resposta." });
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Camera image description
  app.post("/api/vision", async (req, res) => {
    try {
      const { image, persona } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing base64 image data" });
      }

      const targetPersona = persona === "friday" ? "friday" : "jarvis";
      const systemInstruction = targetPersona === "jarvis"
        ? "Você é JARVIS. Descreva brevemente e de forma natural o que vê na imagem, chamando o usuário de 'senhor'. Português BR, sem formatação de markdown ou asteriscos, no máximo 2 frases."
        : "Você é SEXTA-FEIRA. Descreva brevemente e de forma descontraída o que vê na imagem, chamando-o de 'chefe'. Português BR, sem formatação de markdown ou asteriscos, no máximo 2 frases.";

      const client = getGeminiClient();

      // inlineData expectations: mimeType and data (base64)
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      };

      const textPart = {
        text: "O que você está vendo na imagem da minha câmera de segurança/dispositivo agora? Descreva de forma curta."
      };

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [textPart, imagePart],
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });

      res.json({ text: response.text || "Não consegui reconhecer nada de especial." });
    } catch (error: any) {
      console.error("Error in /api/vision:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Conversation memory summary endpoint
  app.post("/api/summary", async (req, res) => {
    try {
      const { history } = req.body;
      if (!history || !Array.isArray(history) || history.length === 0) {
        return res.json({ text: "Nenhuma conversa registrada ainda." });
      }

      const client = getGeminiClient();

      const recentChatText = history
        .slice(-10)
        .map((m: any) => `${m.role === "assistant" ? "Assistente" : "Usuário"}: ${m.content}`)
        .join("\n");

      const prompt = `Aqui está o histórico recente de conversa:\n${recentChatText}\n\nPor favor, resuma em duas frases curtas os principais temas discutidos nessa conversa, sem usar markdown ou asteriscos. Fale na terceira pessoa, de forma neutra e direta.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um assistente analítico conciso que resume o teor de uma conversa recente de forma extremamente curta, objetiva e direta em português brasileiro.",
          temperature: 0.5,
        }
      });

      res.json({ text: response.text || "Temas variados em debate." });
    } catch (error: any) {
      console.error("Error in /api/summary:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite development or production server configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
