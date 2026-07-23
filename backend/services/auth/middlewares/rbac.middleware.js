import pool from "../../../shared/db/postgres.js";

// Role hierarchy/rank mapping
const ROLE_RANKS = {
  Owner: 100,
  Admin: 80,
  Manager: 60,
  Developer: 40,
  Viewer: 20,
  Guest: 10,
};

/**
 * Middleware to check if user has a minimum required role in the organization.
 * @param {string} minRequiredRole e.g. "Admin", "Developer"
 */
export function checkRole(minRequiredRole) {
  return async (req, res, next) => {
    try {
      const userId = req.headers["x-user-id"] || req.user?.userId;
      const organizationId = req.headers["x-organization-id"] || req.query.organizationId || req.body.organizationId;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }
      
      if (!organizationId) {
        return res.status(400).json({ success: false, message: "Organization ID is required" });
      }
      
      const memberQuery = await pool.query(
        "SELECT role FROM members WHERE organization_id = $1 AND user_id = $2",
        [organizationId, userId]
      );
      
      if (memberQuery.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Access denied: not a member of this organization" });
      }
      
      const userRole = memberQuery.rows[0].role;
      const userRank = ROLE_RANKS[userRole] || 0;
      const requiredRank = ROLE_RANKS[minRequiredRole] || 100;
      
      if (userRank < requiredRank) {
        return res.status(403).json({ success: false, message: `Access denied: minimum role required is ${minRequiredRole}` });
      }
      
      req.userRole = userRole;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
