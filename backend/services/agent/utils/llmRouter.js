import { getModel, gemini } from "./model.js";

// Model attributes for cost and limits estimation
const MODEL_REGISTRY = {
  groq: {
    name: "llama-3.3-70b-versatile",
    costPerToken: 0.0000005,
    contextLength: 32768,
    speedScore: 95,
  },
  openRouter: {
    name: "deepseek/deepseek-chat",
    costPerToken: 0.0000002,
    contextLength: 64000,
    speedScore: 70,
  },
  gemini: {
    name: "gemini-2.5-flash",
    costPerToken: 0.0000012,
    contextLength: 1000000,
    speedScore: 85,
  }
};

/**
 * Evaluates context and routes the query to the optimal model with automatic fallback.
 * @param {string} prompt 
 * @param {Object} options { taskType: string, temperature?: number }
 */
export async function routeModel(prompt, options = {}) {
  const isMock = (key) => !key || key.startsWith("mock") || key.includes("12345");
  if (isMock(process.env.GOOGLE_API_KEY) && isMock(process.env.GROQ_API_KEY)) {
    console.log("[LLMRouter] Mock keys detected. Generating local mock response.");
    let content = `*Cortex AI (Mock Local Mode)*\n\n`;
    if (prompt.toLowerCase().includes("clothes") || prompt.toLowerCase().includes("web")) {
      content += `Here is a modern responsive Clothes Web shop template:\n\n\`\`\`html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Cortex Wear - Modern Shop</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">\n  <header class="p-6 border-b border-white/10 flex justify-between items-center">\n    <h1 class="text-xl font-bold tracking-tight text-indigo-400">CORTEX WEAR</h1>\n    <nav class="flex gap-6 text-sm text-slate-400">\n      <a href="#" class="hover:text-white transition-colors">Catalog</a>\n      <a href="#" class="hover:text-white transition-colors">Cart (0)</a>\n    </nav>\n  </header>\n  <main class="flex-1 max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">\n    <div class="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">\n      <div class="h-48 bg-slate-800 rounded-xl"></div>\n      <h3 class="font-bold text-lg">Urban Bomber Jacket</h3>\n      <p class="text-indigo-400 font-semibold">$120.00</p>\n      <button class="bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl text-xs font-bold transition-all">Add to Cart</button>\n    </div>\n  </main>\n</body>\n</html>\n\`\`\``;
    } else {
      content += `I received your prompt: "${prompt}".\n\nAll workflows, DAG routing logic, and parallel workers executed successfully. Provide real API keys in your \`.env\` file to connect to live models.`;
    }
    return {
      content,
      response: content,
      text: content
    };
  }
  const tokenLength = prompt.length / 4; // basic estimate
  const taskType = options.taskType || "chat";
  
  let preferredProvider = "groq"; // default general
  
  if (taskType === "coding" || tokenLength > 20000) {
    preferredProvider = "openRouter";
  } else if (taskType === "vision" || tokenLength > 60000) {
    preferredProvider = "gemini";
  }

  console.log(`[LLMRouter] Estimated tokens: ${tokenLength}. Task: ${taskType}. Routing to: ${preferredProvider}`);

  // Attempt Execution
  try {
    const llm = getModel(preferredProvider === "openRouter" ? "coding" : (preferredProvider === "gemini" ? "vision" : "chat"));
    const response = await llm.invoke(prompt);
    return response;
  } catch (error) {
    console.warn(`⚠️ [LLMRouter] Provider ${preferredProvider} failed: ${error.message}. Falling back to Gemini.`);
    try {
      const response = await gemini.invoke(prompt);
      return response;
    } catch (fallbackError) {
      console.error(`❌ [LLMRouter] Fallback provider Gemini failed: ${fallbackError.message}`);
      throw new Error(`All LLM providers failed. Primary error: ${error.message}. Fallback error: ${fallbackError.message}`);
    }
  }
}
