import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenRouter } from "@langchain/openrouter";
import dotenv from "dotenv";
dotenv.config();

const isMock = (key) => !key || key.startsWith("mock") || key.includes("12345");

class MockLLM {
  constructor(name) {
    this.name = name;
  }
  async invoke(messages) {
    let rawPrompt = "";
    if (Array.isArray(messages)) {
      rawPrompt = messages[messages.length - 1].content || messages[messages.length - 1].text || "";
    } else if (messages && typeof messages === "object") {
      rawPrompt = messages.content || messages.text || "";
    } else {
      rawPrompt = String(messages || "");
    }

    // Clean prompt to extract only the user's request (ignoring system instructions)
    let cleanPrompt = rawPrompt;
    if (rawPrompt.includes("User Request:")) {
      cleanPrompt = rawPrompt.split("User Request:").pop().trim();
    } else if (rawPrompt.includes("INTENT DETECTION")) {
      // safe fallback for older prompts
      cleanPrompt = rawPrompt.substring(rawPrompt.length - 100);
    }

    console.log(`[MockLLM ${this.name}] User prompt: "${cleanPrompt.substring(0, 80)}"`);
    
    let content = `*Cortex AI (Simulated ${this.name} response)*\n\n`;
    const p = cleanPrompt.toLowerCase();

    if (p.includes("clothes") || p.includes("web") || p.includes("shop")) {
      content += `Here is a modern responsive Clothes Web shop template:\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Cortex Wear - Modern Shop</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">\n  <header class="p-6 border-b border-white/10 flex justify-between items-center">\n    <h1 class="text-xl font-bold tracking-tight text-indigo-400">CORTEX WEAR</h1>\n    <nav class="flex gap-6 text-sm text-slate-400">\n      <a href="#" class="hover:text-white transition-colors">Catalog</a>\n      <a href="#" class="hover:text-white transition-colors">Cart (0)</a>\n    </nav>\n  </header>\n  <main class="flex-1 max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">\n    <div class="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">\n      <div class="h-48 bg-slate-800 rounded-xl"></div>\n      <h3 class="font-bold text-lg">Urban Bomber Jacket</h3>\n      <p class="text-indigo-400 font-semibold">$120.00</p>\n      <button class="bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl text-xs font-bold transition-all">Add to Cart</button>\n    </div>\n  </main>\n</body>\n</html>\n\`\`\``;
    } else if (p.includes("virat") || p.includes("kohli")) {
      content += `**Virat Kohli** is an Indian international cricketer and former captain of the Indian national cricket team. Widely regarded as one of the greatest batsmen in the history of the sport, he plays for Royal Challengers Bangalore in the IPL and Delhi in domestic cricket.`;
    } else if (p.includes("repo") || p.includes("reverse")) {
      content += `The **Reverse Repo Rate** is the rate at which the central bank of a country (like the Reserve Bank of India) borrows money from commercial banks within the country. It is a monetary policy instrument used to control the money supply and liquidity in the economy.`;
    } else if (p.includes("stream") || p.includes("func")) {
      content += `In AI, a **Stream Function** refers to the capability of an API or LLM to return output tokens incrementally as they are generated, rather than buffering the entire response. This provides real-time text updates, significantly improving user interactivity and responsiveness.`;
    } else {
      content += `I received your message: "${cleanPrompt}".\n\nConfigure valid API credentials in the \`.env\` file of the agent service to execute live routing pipelines.`;
    }
    
    return {
      content,
      response: content,
      text: content,
      toString: () => content
    };
  }
  async *stream(messages) {
    const res = await this.invoke(messages);
    const words = res.content.split(" ");
    for (const word of words) {
      yield {
        content: word + " ",
        toString: () => word + " "
      };
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }
}

const openRouter = isMock(process.env.OPENROUTER_API_KEY)
  ? new MockLLM("DeepSeek (OpenRouter)")
  : new ChatOpenRouter({
      model: "deepseek/deepseek-chat",
      temperature: 0,
      maxTokens: 2500
    });

export const gemini = isMock(process.env.GOOGLE_API_KEY)
  ? new MockLLM("Gemini")
  : new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY
    });

const groq = isMock(process.env.GROQ_API_KEY)
  ? new MockLLM("Llama (Groq)")
  : new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      maxTokens: undefined,
      maxRetries: 2
    });

export const getModel = (agent) => {
  switch (agent) {
    case "coding":
      return openRouter;
    case "image":
      return groq;
    case "search":
      return groq;
    case "chat":
      return groq;
    case "vision":
      return gemini;
    default:
      return groq;
  }
};