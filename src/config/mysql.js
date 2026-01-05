import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 100,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+03:00',
});

// Promise wrapper
const db = pool.promise();

// Export just db (default)
export default db;

// Export a test function
export const testConnection = async () => {
  try {
    const [result] = await db.query("SELECT 1 as connected, NOW() as time, DATABASE() as db");
    console.log(`✅ MySQL Connected: ${result[0].db} at ${result[0].time}`);
    return true;
  } catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
    return false;
  }
};