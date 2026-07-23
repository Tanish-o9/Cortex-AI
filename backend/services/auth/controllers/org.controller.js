import pool from "../../../shared/db/postgres.js";

// Create a new organization and assign creator as Owner
export async function createOrg(req, res) {
  const { name } = req.body;
  const userId = req.headers["x-user-id"] || req.user?.userId;

  if (!name) {
    return res.status(400).json({ success: false, message: "Organization name is required" });
  }

  try {
    // Start transaction
    await pool.query("BEGIN");

    const orgResult = await pool.query(
      "INSERT INTO organizations (name) VALUES ($1) RETURNING *",
      [name]
    );
    const org = orgResult.rows[0];

    await pool.query(
      "INSERT INTO members (organization_id, user_id, role) VALUES ($1, $2, $3)",
      [org.id, userId, "Owner"]
    );

    await pool.query("COMMIT");

    res.status(201).json({ success: true, organization: org });
  } catch (error) {
    await pool.query("ROLLBACK");
    res.status(500).json({ success: false, message: error.message });
  }
}

// Create a team inside an organization
export async function createTeam(req, res) {
  const { name, organizationId } = req.body;

  if (!name || !organizationId) {
    return res.status(400).json({ success: false, message: "Team name and organizationId are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO teams (organization_id, name) VALUES ($1, $2) RETURNING *",
      [organizationId, name]
    );
    res.status(201).json({ success: true, team: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Create a project inside a team
export async function createProject(req, res) {
  const { name, teamId } = req.body;

  if (!name || !teamId) {
    return res.status(400).json({ success: false, message: "Project name and teamId are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO projects (team_id, name) VALUES ($1, $2) RETURNING *",
      [teamId, name]
    );
    res.status(201).json({ success: true, project: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Invite/Add a member to an organization
export async function inviteMember(req, res) {
  const { organizationId, memberUserId, role } = req.body;

  if (!organizationId || !memberUserId || !role) {
    return res.status(400).json({ success: false, message: "organizationId, memberUserId, and role are required" });
  }

  const validRoles = ["Owner", "Admin", "Manager", "Developer", "Viewer", "Guest"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role specified" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO members (organization_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role RETURNING *",
      [organizationId, memberUserId, role]
    );
    res.status(200).json({ success: true, member: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// List all organizations for the user
export async function listOrgs(req, res) {
  const userId = req.headers["x-user-id"] || req.user?.userId;

  try {
    const result = await pool.query(
      "SELECT o.*, m.role FROM organizations o JOIN members m ON o.id = m.organization_id WHERE m.user_id = $1",
      [userId]
    );
    res.status(200).json({ success: true, organizations: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// List all members in an organization
export async function listMembers(req, res) {
  const { organizationId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM members WHERE organization_id = $1",
      [organizationId]
    );
    res.status(200).json({ success: true, members: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fetch all audit logs for the organization (Admins/Owners only)
export async function getAuditLogs(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100"
    );
    res.status(200).json({ success: true, auditLogs: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
