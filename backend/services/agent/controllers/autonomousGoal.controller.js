import { AutonomousGoal } from "../models/autonomousGoal.model.js";
import { routeModel } from "../utils/llmRouter.js";

/**
 * Creates an autonomous goal, decomposes it into subtasks, and starts execution.
 */
export async function createGoal(req, res) {
  const { title, description } = req.body;
  const userId = req.headers["x-user-id"] || "guest";

  if (!title) {
    return res.status(400).json({ success: false, message: "Title is required." });
  }

  try {
    console.log(`[AutonomousGoalController] Decomposing goal: "${title}"`);
    
    const decompositionPrompt = `
You are an expert system architect and project manager.
Please decompose the following high-level project goal into a sequential checklist of 4 to 6 logical subtasks with dependencies.

Main Goal: "${title}"
Goal Description: "${description || "None"}"

Output MUST be a valid JSON array of objects. Do not include markdown code block styling or extra conversational text; output ONLY valid JSON.
Each object in the array must have the following fields:
- id: A short unique identifier (e.g., "task_1", "task_2", "task_3")
- title: A brief title of the subtask
- description: Detailed instructions of what to perform in this subtask
- dependsOn: An array of IDs of parent tasks that must complete before this task can start (e.g., ["task_1"])

Example Output:
[
  { "id": "task_1", "title": "System Initialization", "description": "Set up workspace directories and baseline configs.", "dependsOn": [] },
  { "id": "task_2", "title": "Database Schema Setup", "description": "Define schema documents and establish connection pools.", "dependsOn": ["task_1"] }
]
`;

    const response = await routeModel(decompositionPrompt, { taskType: "chat" });
    const rawText = response.content || response.response || String(response);
    
    // Clean code blocks if LLM included them
    const cleanedText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let tasks = [];
    try {
      tasks = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.warn("[AutonomousGoalController] JSON parse failed, utilizing fallback structure.", parseErr);
      // Fallback decomposition in case LLM format fails
      tasks = [
        { id: "task_1", title: "Project Scoping & Setup", description: `Initialize resources for: ${title}.`, dependsOn: [] },
        { id: "task_2", title: "Architecture Blueprinting", description: "Design service maps and component connections.", dependsOn: ["task_1"] },
        { id: "task_3", title: "Core Component Assembly", description: "Implement business controllers and logic modules.", dependsOn: ["task_2"] },
        { id: "task_4", title: "Validation & Summary report", description: "Verify execution logs and prepare handoff.", dependsOn: ["task_3"] }
      ];
    }

    // Initialize all tasks as PENDING
    const formattedTasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: "PENDING",
      dependsOn: t.dependsOn || [],
      logs: [`[System] Task initialized. Waiting for dependencies.`],
      day: 1
    }));

    const newGoal = await AutonomousGoal.create({
      title,
      description,
      userId,
      status: "RUNNING",
      tasks: formattedTasks
    });

    res.status(201).json({ success: true, goal: newGoal });
  } catch (error) {
    console.error("[AutonomousGoalController] Error creating goal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Lists all goals for a user.
 */
export async function listGoals(req, res) {
  const userId = req.headers["x-user-id"] || "guest";
  try {
    const goals = await AutonomousGoal.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Gets a specific goal.
 */
export async function getGoal(req, res) {
  try {
    const goal = await AutonomousGoal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }
    res.status(200).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Handles Pausing, Resuming, or Cancelling a goal.
 */
export async function updateGoalStatus(req, res) {
  const { id } = req.params;
  const { action } = req.body; // "PAUSE" | "RESUME" | "CANCEL"

  try {
    const goal = await AutonomousGoal.findById(id);
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found." });
    }

    if (action === "PAUSE") {
      goal.status = "PAUSED";
    } else if (action === "RESUME") {
      goal.status = "RUNNING";
      // If the goal was failed, reset the failed tasks back to pending to allow retry
      goal.tasks.forEach(t => {
        if (t.status === "FAILED") {
          t.status = "PENDING";
          t.logs.push(`[System] Task execution reset to pending for retry.`);
        }
      });
    } else if (action === "CANCEL") {
      goal.status = "CANCELLED";
    } else {
      return res.status(400).json({ success: false, message: "Invalid action request." });
    }

    goal.updatedAt = new Date();
    await goal.save();

    res.status(200).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
