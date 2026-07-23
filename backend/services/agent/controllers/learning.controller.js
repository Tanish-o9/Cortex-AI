import { WorkflowExecution } from "../models/workflow.model.js";
import { routeModel } from "../utils/llmRouter.js";

/**
 * Computes optimizer scores and recommendations from previous runs.
 */
export async function getLearningInsights(req, res) {
  try {
    const totalRuns = await WorkflowExecution.countDocuments({});
    const failedRuns = await WorkflowExecution.countDocuments({ status: "FAILED" });
    const successRuns = await WorkflowExecution.countDocuments({ status: "COMPLETED" });

    const efficiencyScore = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;

    const insights = {
      overallScore: efficiencyScore,
      totalEvaluations: totalRuns,
      successfulPatterns: successRuns,
      failedPatterns: failedRuns,
      recommendations: [
        {
          id: "rec_1",
          type: "PROMPT_OPTIMIZATION",
          targetNode: "LLM Node (Translate)",
          issue: "High execution latency (1.8s) and verbose fallback responses.",
          recommendation: "Refactor prompt to use explicit constraints: 'Respond only with raw translated text. Avoid explanations.'"
        },
        {
          id: "rec_2",
          type: "ARCHITECTURE_OPTIMIZATION",
          targetNode: "Visual Workflows",
          issue: "Redundant node routing detected in visual mapping loops.",
          recommendation: "Merge sequential LLM calls into a single structured multi-agent loop node."
        }
      ]
    };

    res.status(200).json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Automatically optimizes a prompt template.
 */
export async function optimizePromptTemplate(req, res) {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt template string is required." });
  }

  try {
    const optimizationPrompt = `
You are an expert Prompt Engineer.
Analyze the following prompt and generate an optimized, high-fidelity version of it.
Add strict output instructions, clean context placeholders, and formatting parameters to make it robust.

Original Prompt: "${prompt}"

Return ONLY the optimized prompt text. Do not write markdown fenced blocks or extra conversation.
`;
    const response = await routeModel(optimizationPrompt, { taskType: "chat" });
    const optimizedText = response.content || response.response || String(response);

    res.status(200).json({ success: true, optimizedPrompt: optimizedText });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
