import pkg from "pg";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
  max:20,
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:3000,
});


pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

export default pool;