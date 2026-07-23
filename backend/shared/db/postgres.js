import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || "postgresql://cortex_user:cortex_password@localhost:5435/cortex_db",
});

const initSchemaSql = `
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Guest', -- Owner, Admin, Manager, Developer, Viewer, Guest
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id VARCHAR(255),
  actor_email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  target VARCHAR(255) NOT NULL,
  details TEXT,
  status VARCHAR(50) NOT NULL,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS secrets (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) UNIQUE NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(50) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  credits INT NOT NULL,
  billing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

pool.on("connect", async (client) => {
  console.log("✅ PostgreSQL Connected");
  try {
    await client.query(initSchemaSql);
    console.log("✅ PostgreSQL Tables Initialized");
  } catch (err) {
    console.error("❌ Failed to initialize PostgreSQL tables", err);
  }
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL Pool Error", err);
});

// Helper to execute SQL queries
export const query = (text, params) => pool.query(text, params);

export default pool;
