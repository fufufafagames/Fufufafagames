/**
 * Event Model
 */
const db = require("../config/database");

module.exports = {
  /**
   * Get active event
   * @returns {Promise<object|null>} Active event or null
   */
  getActive: async () => {
    try {
      const result = await db.query(
        "SELECT * FROM events WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1"
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching active event:", error);
      return null;
    }
  },

  /**
   * Get all events
   */
  getAll: async () => {
    const result = await db.query("SELECT * FROM events ORDER BY created_at DESC");
    return result.rows;
  }
};
