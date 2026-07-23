import { routeModel } from "../utils/llmRouter.js";

/**
 * Project Manager Agent analyzes a goal and plans a Sprint with Kanban board tasks.
 * @param {string} title Project title 
 * @param {string} description Project description 
 * @returns {Promise<Array>} List of structured Kanban tasks
 */
export async function runProjectManagerAgent(title, description = "") {
  console.log(`[ProjectManagerAgent] Decomposing project milestones for: "${title}"`);

  const prompt = `
You are an expert Agile Scrum Project Manager.
Analyze the following project and plan a Sprint Board with a list of tasks distributed in columns.
Project Title: "${title}"
Project Description: "${description}"

Decompose this project into a detailed Agile backlog. Specify:
1. Milestone name
2. Detailed list of tasks
3. Assignee for each task (must be either "CodingAgent", "SearchAgent", or "User")
4. Priority ("Low", "Medium", "High")
5. Dependencies (which task IDs must complete first)

Output MUST be a valid JSON array of task objects. Do not include markdown code block styling or extra conversational text; output ONLY valid JSON.
Each object must have the following fields:
- id: A unique task code (e.g. "task_1", "task_2")
- title: Brief title
- description: Detailed work instructions
- assignee: "CodingAgent" | "SearchAgent" | "User"
- priority: "Low" | "Medium" | "High"
- dependsOn: Array of task IDs (e.g. ["task_1"])
- status: "todo"

Example Output:
[
  { "id": "task_1", "title": "Repo Setup", "description": "Set up project base directories.", "assignee": "CodingAgent", "priority": "High", "dependsOn": [], "status": "todo" },
  { "id": "task_2", "title": "Gather API endpoints", "description": "Search public APIs for data integration.", "assignee": "SearchAgent", "priority": "Medium", "dependsOn": ["task_1"], "status": "todo" }
]
`;

  try {
    const response = await routeModel(prompt, { taskType: "chat" });
    const rawText = response.content || response.response || String(response);
    
    const cleanedText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("[ProjectManagerAgent] Error decomposing project:", err);
    // Fallback Sprint Backlog
    return [
      { id: "task_1", title: "Initialize Architecture", description: "Set up directory paths and basic routing controllers.", assignee: "CodingAgent", priority: "High", dependsOn: [], status: "todo" },
      { id: "task_2", title: "Conduct Tech Discovery", description: "Search docs for optimal API structures.", assignee: "SearchAgent", priority: "Medium", dependsOn: [], status: "todo" },
      { id: "task_3", title: "Assemble Application Interface", description: "Build React pages and form layouts.", assignee: "User", priority: "High", dependsOn: ["task_1"], status: "todo" },
      { id: "task_4", title: "Perform Security Audit", description: "Audit environment secrets and rate limits.", assignee: "CodingAgent", priority: "Medium", dependsOn: ["task_2"], status: "todo" }
    ];
  }
}
