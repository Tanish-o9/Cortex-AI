import { AutonomousGoal } from "../models/autonomousGoal.model.js";
import { routeModel } from "./llmRouter.js";

let intervalId = null;
let isPolling = false;

/**
 * Starts the polling worker for running autonomous goals.
 */
export function startAutonomousGoalExecutor() {
  if (intervalId) return;
  console.log("[AutonomousExecutor] Starting background task runner loop...");
  intervalId = setInterval(pollRunningGoals, 4000);
}

/**
 * Stops the polling worker.
 */
export function stopAutonomousGoalExecutor() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Main worker loop.
 */
async function pollRunningGoals() {
  if (isPolling) return;
  isPolling = true;

  try {
    const activeGoals = await AutonomousGoal.find({ status: "RUNNING" });
    for (const goal of activeGoals) {
      await processGoal(goal);
    }
  } catch (error) {
    console.error("[AutonomousExecutor] Error during poll:", error);
  } finally {
    isPolling = false;
  }
}

/**
 * Processes a single goal's subtask executions.
 */
async function processGoal(goal) {
  // If the goal is not in RUNNING state anymore, skip
  const freshGoal = await AutonomousGoal.findById(goal._id);
  if (!freshGoal || freshGoal.status !== "RUNNING") return;

  const tasks = freshGoal.tasks;
  const completedTaskIds = new Set(
    tasks.filter(t => t.status === "COMPLETED").map(t => t.id)
  );

  // Find a task that is PENDING and whose dependencies are met
  const nextTask = tasks.find(task => {
    if (task.status !== "PENDING") return false;
    // Every dependent task must be completed
    return task.dependsOn.every(depId => completedTaskIds.has(depId));
  });

  if (!nextTask) {
    // Check if everything is completed
    const allCompleted = tasks.every(t => t.status === "COMPLETED");
    const hasFailed = tasks.some(t => t.status === "FAILED");

    if (allCompleted) {
      freshGoal.status = "COMPLETED";
      freshGoal.currentTaskId = null;
      await freshGoal.save();
      console.log(`[AutonomousExecutor] Goal [${freshGoal.title}] COMPLETED successfully!`);
    } else if (hasFailed) {
      freshGoal.status = "FAILED";
      await freshGoal.save();
      console.log(`[AutonomousExecutor] Goal [${freshGoal.title}] FAILED due to subtask failures.`);
    }
    return;
  }

  // Set task to RUNNING
  nextTask.status = "RUNNING";
  nextTask.logs.push(`[System] Task execution started.`);
  freshGoal.currentTaskId = nextTask.id;
  await freshGoal.save();

  console.log(`[AutonomousExecutor] Executing task [${nextTask.title}] for Goal [${freshGoal.title}]`);

  try {
    // Gather outputs of all parent dependencies
    const parentOutputs = tasks
      .filter(t => nextTask.dependsOn.includes(t.id))
      .map(t => `Task: ${t.title}\nOutput: ${t.output || "None"}`)
      .join("\n\n");

    const prompt = `
You are an autonomous AI Operating System agent executing a subtask of the larger goal: "${freshGoal.title}".
Goal Description: ${freshGoal.description}

Active Subtask to execute:
- Title: ${nextTask.title}
- Description: ${nextTask.description}

Context from parent tasks:
${parentOutputs || "No parent tasks executed yet."}

Please complete the task instructions, write a brief progress report detailing your accomplishments, and output the final result.
`;

    nextTask.logs.push(`[System] Dispatching to LLM agent routing layer...`);
    await freshGoal.save();

    // Call routeModel to perform the work
    const llmResponse = await routeModel(prompt, { taskType: "coding" });
    const outputText = llmResponse.content || llmResponse.response || String(llmResponse);

    // Save outputs and update state
    const currentFreshGoal = await AutonomousGoal.findById(goal._id);
    if (!currentFreshGoal || currentFreshGoal.status !== "RUNNING") return;

    const freshTask = currentFreshGoal.tasks.id(nextTask._id);
    freshTask.status = "COMPLETED";
    freshTask.output = outputText;
    freshTask.logs.push(`[Agent] Task completed successfully.`);
    freshTask.logs.push(`[Agent] Output report generated.`);

    // Determine virtual day. Let's make every 2 completed tasks equal 1 virtual day.
    const totalCompleted = currentFreshGoal.tasks.filter(t => t.status === "COMPLETED").length;
    const currentDay = Math.ceil(totalCompleted / 2) || 1;
    freshTask.day = currentDay;

    // Check if we just transitioned to a new day or finished the goal, so we generate a daily summary!
    const isEndOfDay = totalCompleted % 2 === 0 || totalCompleted === currentFreshGoal.tasks.length;
    const existingSummaryForDay = currentFreshGoal.dailySummaries.find(s => s.day === currentDay);

    if (isEndOfDay && !existingSummaryForDay) {
      // Generate daily summary report via LLM
      const dayTasks = currentFreshGoal.tasks.filter(t => t.status === "COMPLETED" && t.day === currentDay);
      const dayTasksSummaryInput = dayTasks.map(t => `- Task: ${t.title}\n  Summary: ${t.output.substring(0, 300)}...`).join("\n");

      const summaryPrompt = `
Generate a professional, concise executive summary of the accomplishments completed on Day ${currentDay} of the project: "${currentFreshGoal.title}".
Tasks completed on Day ${currentDay}:
${dayTasksSummaryInput}

Keep it under 3-4 bullet points outlining key achievements.
`;
      const summaryResult = await routeModel(summaryPrompt, { taskType: "chat" });
      const summaryText = summaryResult.content || summaryResult.response || String(summaryResult);
      
      currentFreshGoal.dailySummaries.push({
        day: currentDay,
        summary: summaryText,
        createdAt: new Date()
      });
    }

    await currentFreshGoal.save();
    console.log(`[AutonomousExecutor] Subtask [${nextTask.title}] COMPLETED.`);

  } catch (err) {
    console.error(`[AutonomousExecutor] Error executing task [${nextTask.title}]:`, err);
    
    const errorFreshGoal = await AutonomousGoal.findById(goal._id);
    if (errorFreshGoal) {
      const errTask = errorFreshGoal.tasks.id(nextTask._id);
      if (errTask) {
        errTask.status = "FAILED";
        errTask.error = err.message;
        errTask.logs.push(`[Error] Task execution failed: ${err.message}`);
      }
      errorFreshGoal.status = "FAILED";
      await errorFreshGoal.save();
    }
  }
}
