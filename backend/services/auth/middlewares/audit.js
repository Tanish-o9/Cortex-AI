import pool from "../../../shared/db/postgres.js";

/**
 * Audit logging middleware.
 * Records the API request, user details, target endpoint, and execution status.
 */
export function auditLogger(actionOverride) {
  return async (req, res, next) => {
    const actorId = req.headers["x-user-id"] || req.user?.userId || "anonymous";
    const actorEmail = req.headers["x-user-email"] || req.user?.email || "anonymous@cortex.ai";
    const action = actionOverride || `${req.method} ${req.originalUrl}`;
    const target = req.baseUrl || req.path;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    res.on("finish", async () => {
      try {
        const details = JSON.stringify({
          query: req.query,
          body: req.body ? { ...req.body, password: "[REDACTED]", token: "[REDACTED]" } : {},
          statusCode: res.statusCode
        });
        const status = res.statusCode >= 400 ? "FAILED" : "SUCCESS";
        
        await pool.query(
          "INSERT INTO audit_logs (actor_id, actor_email, action, target, details, status, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [actorId, actorEmail, action, target, details, status, ipAddress]
        );
      } catch (err) {
        console.error("❌ Failed to write audit log to PostgreSQL:", err);
      }
    });

    next();
  };
}
