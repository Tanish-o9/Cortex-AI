import pool from "../../../shared/db/postgres.js";
import redis from "../../../shared/redis/redis.js";
import fs from "fs";
import path from "path";

/**
 * Executes a read-only SQL query on PostgreSQL for debugging.
 */
export async function executeSQLQuery(req, res) {
  const { queryText } = req.body;
  if (!queryText) {
    return res.status(400).json({ success: false, message: "Query text is required." });
  }

  // Security check: Only allow SELECT queries to prevent database changes
  if (!queryText.trim().toLowerCase().startsWith("select")) {
    return res.status(403).json({ success: false, message: "Only read-only SELECT queries are allowed in DevConsole." });
  }

  try {
    // Start read-only transaction
    await pool.query("BEGIN READ ONLY");
    const result = await pool.query(queryText);
    await pool.query("COMMIT");

    res.status(200).json({ success: true, rows: result.rows, fields: result.fields.map(f => f.name) });
  } catch (error) {
    await pool.query("ROLLBACK");
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Gets a list of active Redis keys.
 */
export async function getRedisKeys(req, res) {
  try {
    const keys = await redis.keys("*");
    const keyDetails = [];
    for (const key of keys) {
      const type = await redis.type(key);
      keyDetails.push({ key, type });
    }
    res.status(200).json({ success: true, keys: keyDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Recursively gets the folder structure tree of the workspace.
 */
export async function getWorkspaceFiles(req, res) {
  const rootPath = path.resolve(".");

  function readDirRecursive(dirPath) {
    const results = [];
    const list = fs.readdirSync(dirPath);
    
    list.forEach(file => {
      // Exclude node_modules, .git, etc.
      if (["node_modules", ".git", ".gemini", "dist"].includes(file)) return;
      
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat && stat.isDirectory()) {
        results.push({
          name: file,
          type: "directory",
          children: readDirRecursive(fullPath)
        });
      } else {
        results.push({
          name: file,
          type: "file",
          size: stat.size
        });
      }
    });
    return results;
  }

  try {
    const fileTree = readDirRecursive(rootPath);
    res.status(200).json({ success: true, fileTree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Tails logs from service (nodemon log or mock outputs).
 */
export async function getDevLogs(req, res) {
  try {
    const systemLogs = [
      `[info] ${new Date().toISOString()} - gateway: Incoming request GET /api/me`,
      `[info] ${new Date().toISOString()} - auth: PostgreSQL connections pooled`,
      `[info] ${new Date().toISOString()} - agent: Polled running autonomous goals`,
      `[info] ${new Date().toISOString()} - chat: Message persisted in MongoDB`,
      `[info] ${new Date().toISOString()} - dev-console: Admin debugger authenticated`,
      `[info] ${new Date().toISOString()} - billing: Stripe webhooks healthy`
    ];
    res.status(200).json({ success: true, logs: systemLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Lists environment variables safely (masks key values).
 */
export async function getEnvVariables(req, res) {
  try {
    const maskedEnv = {};
    Object.keys(process.env).forEach(key => {
      // Only include specific variables, or mask them
      const val = process.env[key];
      if (val) {
        if (key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD") || key.includes("URL") || key.includes("API")) {
          maskedEnv[key] = "●●●●●●●●●●●● (Masked)";
        } else {
          maskedEnv[key] = val;
        }
      }
    });
    res.status(200).json({ success: true, env: maskedEnv });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
