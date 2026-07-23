import cron from "node-cron";
import { Workflow } from "../models/workflow.model.js";
import { executeWorkflow } from "./workflowEngine.js";

const scheduledTasks = new Map(); // workflowId -> CronJob

/**
 * Initializes and loads all active scheduled workflows from the database.
 */
export async function initializeScheduler() {
  console.log("[Scheduler] Initializing cron scheduler...");
  try {
    const workflows = await Workflow.find({ "data.cronExpression": { $ne: null } });
    for (const workflow of workflows) {
      scheduleWorkflow(workflow);
    }
  } catch (err) {
    console.error("[Scheduler] Initialization failed:", err.message);
  }
}

/**
 * Dynamically schedules a workflow execution.
 */
export function scheduleWorkflow(workflow) {
  const cronExpression = workflow.data?.cronExpression;
  if (!cronExpression || !cron.validate(cronExpression)) {
    return;
  }
  
  // Stop existing if any
  if (scheduledTasks.has(workflow._id.toString())) {
    unscheduleWorkflow(workflow._id);
  }

  const task = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] Triggering scheduled execution for workflow [${workflow._id}]`);
    try {
      await executeWorkflow(workflow, "scheduler-system");
    } catch (e) {
      console.error(`[Scheduler] Execution failed for workflow [${workflow._id}]:`, e.message);
    }
  });

  scheduledTasks.set(workflow._id.toString(), task);
  console.log(`[Scheduler] Scheduled workflow [${workflow.name}] with expression: ${cronExpression}`);
}

/**
 * Stop a scheduled workflow execution.
 */
export function unscheduleWorkflow(workflowId) {
  const task = scheduledTasks.get(workflowId.toString());
  if (task) {
    task.stop();
    scheduledTasks.delete(workflowId.toString());
    console.log(`[Scheduler] Unscheduled workflow: ${workflowId}`);
  }
}
