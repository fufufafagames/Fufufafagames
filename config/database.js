/**
 * Database Configuration - Supabase PostgreSQL Connection
 * Menggunakan pg Pool untuk connection pooling
 */

const { Pool } = require("pg");

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required untuk Supabase
  },
  max: 10, // Reduced max clients to prevent resource locking
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000, // Increase wait time
  keepAlive: true, // Prevent TCP drop
});

// Test connection
pool.on("connect", () => {
  console.log("Database connected successfully");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
  process.exit(-1);
});

/**
 * Execute SQL query
 * @param {string} text - SQL query string
 * @param {array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = (text, params) => {
  return pool.query(text, params);
};

module.exports = {
  query,
  pool,
};
