import { Sprint } from "../models/projectManager.model.js";
import { runProjectManagerAgent } from "../agents/projectManager.agent.js";

/**
 * Creates a Sprint board, decomposing goals into Kanban cards.
 */
export async function createSprint(req, res) {
  const { name, description } = req.body;
  const userId = req.headers["x-user-id"] || "guest";

  if (!name) {
    return res.status(400).json({ success: false, message: "Sprint name is required." });
  }

  try {
    const tasks = await runProjectManagerAgent(name, description || "");
    const sprint = await Sprint.create({
      name,
      userId,
      tasks
    });

    res.status(201).json({ success: true, sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Lists all Sprints for a user.
 */
export async function listSprints(req, res) {
  const userId = req.headers["x-user-id"] || "guest";
  try {
    const sprints = await Sprint.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, sprints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Gets a single Sprint details.
 */
export async function getSprint(req, res) {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint board not found." });
    }
    res.status(200).json({ success: true, sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Updates a Kanban card status column.
 */
export async function updateKanbanTaskStatus(req, res) {
  const { sprintId, taskId } = req.params;
  const { status } = req.body; // "todo" | "in_progress" | "review" | "done"

  const validStatuses = ["todo", "in_progress", "review", "done"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status column." });
  }

  try {
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint board not found." });
    }

    const task = sprint.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task card not found." });
    }

    task.status = status;
    sprint.updatedAt = new Date();
    await sprint.save();

    res.status(200).json({ success: true, sprint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Generates productivity analytics reports for Kanban cards.
 */
export async function getPMInsights(req, res) {
  const { id } = req.params;
  try {
    const sprint = await Sprint.findById(id);
    if (!sprint) {
      return res.status(404).json({ success: false, message: "Sprint board not found." });
    }

    const total = sprint.tasks.length;
    const completed = sprint.tasks.filter(t => t.status === "done").length;
    const inProgress = sprint.tasks.filter(t => t.status === "in_progress").length;
    const review = sprint.tasks.filter(t => t.status === "review").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Detect blockers: Task is in todo or in_progress, but depends on a task that is NOT done
    const completedTaskIds = new Set(sprint.tasks.filter(t => t.status === "done").map(t => t.id));
    const blockers = [];
    sprint.tasks.forEach(t => {
      if (t.status !== "done") {
        const unmetDeps = t.dependsOn.filter(depId => !completedTaskIds.has(depId));
        if (unmetDeps.length > 0) {
          blockers.push({
            taskId: t.id,
            title: t.title,
            blockedBy: unmetDeps
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      insights: {
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        reviewTasks: review,
        completionRate,
        blockersCount: blockers.length,
        blockers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
