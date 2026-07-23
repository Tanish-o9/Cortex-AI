import express from "express";
import { chat } from "../controllers/agent.controller.js";
import { createWorkflow, listWorkflows, getWorkflow, runWorkflow, resumeWorkflow, getPendingApprovals, deleteWorkflow } from "../controllers/workflow.controller.js";
import { createGoal, listGoals, getGoal, updateGoalStatus } from "../controllers/autonomousGoal.controller.js";
import { createSprint, listSprints, getSprint, updateKanbanTaskStatus, getPMInsights } from "../controllers/projectManager.controller.js";
import multer from "../config/multer.js";

const router = express.Router();

router.post(
 "/chat",
 multer.single("file"),
 chat
);

router.post("/workflows", createWorkflow);
router.get("/workflows", listWorkflows);
router.get("/workflows/:id", getWorkflow);
router.delete("/workflows/:id", deleteWorkflow);
router.post("/workflows/:id/execute", runWorkflow);
router.post("/workflows/resume", resumeWorkflow);
router.get("/workflows/approvals/pending", getPendingApprovals);

// Autonomous goals endpoints
router.post("/goals", createGoal);
router.get("/goals", listGoals);
router.get("/goals/:id", getGoal);
router.post("/goals/:id/status", updateGoalStatus);

// Project manager sprints/Kanban endpoints
router.post("/sprints", createSprint);
router.get("/sprints", listSprints);
router.get("/sprints/:id", getSprint);
router.post("/sprints/:sprintId/tasks/:taskId/status", updateKanbanTaskStatus);
router.get("/sprints/:id/insights", getPMInsights);

// Autonomous software engineer endpoints
import { auditRepository, applyAutoFix } from "../controllers/autonomousEngineer.controller.js";
router.post("/engineer/audit", auditRepository);
router.post("/engineer/fix", applyAutoFix);

// Developer tools endpoints
import { executeSQLQuery, getRedisKeys, getWorkspaceFiles, getDevLogs, getEnvVariables } from "../controllers/devTools.controller.js";
router.post("/devtools/sql", executeSQLQuery);
router.get("/devtools/redis", getRedisKeys);
router.get("/devtools/files", getWorkspaceFiles);
router.get("/devtools/logs", getDevLogs);
router.get("/devtools/env", getEnvVariables);

// Security center endpoints
import { scanForSecrets, detectPromptInjection, scanDependencyVulnerabilities } from "../controllers/security.controller.js";
router.get("/security/secrets", scanForSecrets);
router.post("/security/injection", detectPromptInjection);
router.get("/security/vulnerabilities", scanDependencyVulnerabilities);

// Workflow replay endpoints
import { getWorkflowReplay, compareExecutions } from "../controllers/replay.controller.js";
router.get("/replay/:id", getWorkflowReplay);
router.get("/replay/compare", compareExecutions);

// AI learning system endpoints
import { getLearningInsights, optimizePromptTemplate } from "../controllers/learning.controller.js";
router.get("/learning/insights", getLearningInsights);
router.post("/learning/optimize", optimizePromptTemplate);

export default router;