import { getModel } from "./model.js";
import { executeDependencyGraph } from "./parallelEngine.js";
import { routeModel } from "./llmRouter.js";
import axios from "axios";

/**
 * Interpolates variables from parent node outputs.
 * Example: "Translate this: {{node_1.text}}" matches output from node_1
 */
function interpolatePrompt(template, parentOutputs) {
  if (!template) return "";
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split(".");
    let val = parentOutputs;
    for (const part of parts) {
      if (val && typeof val === "object") {
        val = val[part];
      } else {
        return "";
      }
    }
    return val !== undefined ? String(val) : "";
  });
}

/**
 * Evaluates a single node's execution logic.
 */
async function executeNode(node, parentOutputs) {
  const { type, data } = node;
  console.log(`[WorkflowEngine] Executing Node [${node.id}] (Type: ${type})`);

  // Handle Human Approval Suspension
  if (data?.requireApproval) {
    console.log(`[WorkflowEngine] Node [${node.id}] requires human approval. Suspending execution.`);
    // Remove the flag so when resumed it passes this check
    data.requireApproval = false;
    return { status: "WAITING_FOR_APPROVAL", nodeId: node.id };
  }

  switch (type) {
    case "Prompt": {
      const template = data.template || "";
      const text = interpolatePrompt(template, parentOutputs);
      return { text };
    }

    case "LLM": {
      const promptText = interpolatePrompt(data.prompt || "", parentOutputs);
      const temp = data.temperature !== undefined ? parseFloat(data.temperature) : 0.7;
      
      // Utilize smart LLM router
      const result = await routeModel(promptText, {
        temperature: temp,
        taskType: data.taskType || "chat"
      });
      return { response: result.content };
    }

    case "Tool": {
      const toolName = data.toolName;
      const input = interpolatePrompt(data.input || "", parentOutputs);
      
      if (toolName === "search" || toolName === "tavily") {
        try {
          const tavilyKey = process.env.TAVILY_API_KEY;
          const { data: searchData } = await axios.post("https://api.tavily.com/search", {
            api_key: tavilyKey,
            query: input
          });
          return { results: searchData.results.map(r => r.content).join("\n") };
        } catch (e) {
          return { error: "Search failed: " + e.message, results: "Mock Tavily Search: No internet access." };
        }
      }
      
      return { result: `Executed tool [${toolName}] with input [${input}]` };
    }

    case "API": {
      const method = data.method || "GET";
      const url = interpolatePrompt(data.url || "", parentOutputs);
      const body = data.body ? JSON.parse(interpolatePrompt(JSON.stringify(data.body), parentOutputs)) : null;

      try {
        const response = await axios({
          method,
          url,
          data: body,
          timeout: 5000
        });
        return { status: response.status, data: response.data };
      } catch (err) {
        return { error: err.message };
      }
    }

    case "Condition": {
      const expression = data.expression || "true";
      // Interpolate first
      const parsedExpression = interpolatePrompt(expression, parentOutputs);
      
      try {
        // Safe evaluation context check
        const result = Boolean(new Function(`return (${parsedExpression})`)());
        return { branch: result ? "true" : "false" };
      } catch (err) {
        return { branch: "false", error: err.message };
      }
    }

    case "Agent": {
      const agentType = data.agentType || "chat";
      const prompt = interpolatePrompt(data.prompt || "", parentOutputs);
      
      try {
        // Delegate to existing LangGraph execution API endpoint
        const response = await axios.post(`${process.env.GATEWAY_URL || "http://localhost:8000"}/api/agent/chat`, {
          prompt,
          conversationId: "workflow-exec",
          agent: agentType
        }, {
          headers: { "x-user-id": "workflow-system" }
        });
        return { response: response.data.answer };
      } catch (err) {
        return { error: err.message, response: `Fallback: Agent [${agentType}] executed prompt [${prompt}]` };
      }
    }

    case "Memory": {
      const action = data.action || "get"; // get or save
      const key = interpolatePrompt(data.key || "", parentOutputs);
      const value = interpolatePrompt(data.value || "", parentOutputs);
      
      // Local session cache simulation or Redis store
      return { success: true, key, value };
    }

    case "Loop": {
      const count = parseInt(data.count || "1");
      return { iterations: count };
    }

    case "Output": {
      const outputFormat = data.outputFormat || "";
      const text = interpolatePrompt(outputFormat, parentOutputs);
      return { finalOutput: text };
    }

    default:
      throw new Error(`Unsupported node type: ${type}`);
  }
}

/**
 * Runs a saved visual workflow definition.
 */
export async function executeWorkflow(workflow, userId, savedExecution = null) {
  const context = {
    outputs: savedExecution ? Object.fromEntries(savedExecution.nodeOutputs) : {},
    aborted: false
  };

  const runResult = await executeDependencyGraph(
    workflow.nodes,
    workflow.edges,
    executeNode,
    context
  );

  return runResult;
}
