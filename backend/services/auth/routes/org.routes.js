import express from "express";
import { createOrg, createTeam, createProject, inviteMember, listOrgs, listMembers, getAuditLogs } from "../controllers/org.controller.js";
import { checkRole } from "../middlewares/rbac.middleware.js";
import { auditLogger } from "../middlewares/audit.js";

const router = express.Router();

// Public/Owner org setup
router.post("/organizations", auditLogger("Create Organization"), createOrg);
router.get("/organizations", listOrgs);

// Protected team/project creation
router.post("/teams", auditLogger("Create Team"), checkRole("Admin"), createTeam);
router.post("/projects", auditLogger("Create Project"), checkRole("Admin"), createProject);
router.post("/members/invite", auditLogger("Invite Member"), checkRole("Admin"), inviteMember);
router.get("/organizations/:organizationId/members", checkRole("Viewer"), listMembers);

// Audit logging access
router.get("/audit-logs", checkRole("Admin"), getAuditLogs);

export default router;
