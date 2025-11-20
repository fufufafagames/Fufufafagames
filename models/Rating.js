/**
 * Rating Model
 * Handle semua operasi database untuk ratings
 */

const db = require("../config/database");

module.exports = {
  /**
   * Create or update rating
   * @param {object} ratingData - Rating data (user_id, game_id, rating, review)
   * @returns {Promise<object>} Created/updated rating
   */
  createOrUpdate: async (ratingData) => {
    const { user_id, game_id, rating, review } = ratingData;

    // Use INSERT ... ON CONFLICT untuk handle duplicate ratings
    const result = await db.query(
      `INSERT INTO ratings (user_id, game_id, rating, review, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (user_id, game_id) 
             DO UPDATE SET rating = $3, review = $4, updated_at = NOW()
             RETURNING *`,
      [user_id, game_id, rating, review]
    );

    return result.rows[0];
  },

  /**
   * Get all ratings for a game
   * @param {number} gameId - Game ID
   * @returns {Promise<array>} Array of ratings dengan user info
   */
  getByGameId: async (gameId) => {
    const result = await db.query(
      `SELECT ratings.*, users.name as user_name, users.avatar as user_avatar
             FROM ratings 
             JOIN users ON ratings.user_id = users.id 
             WHERE ratings.game_id = $1 
             ORDER BY ratings.created_at DESC`,
      [gameId]
    );
    return result.rows;
  },

  /**
   * Get user's rating for a specific game
   * @param {number} userId - User ID
   * @param {number} gameId - Game ID
   * @returns {Promise<object|null>} Rating object atau null
   */
  getUserRating: async (userId, gameId) => {
    const result = await db.query(
      "SELECT * FROM ratings WHERE user_id = $1 AND game_id = $2",
      [userId, gameId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get rating statistics for a game
   * @param {number} gameId - Game ID
   * @returns {Promise<object>} Rating stats (average, total, breakdown)
   */
  getStats: async (gameId) => {
    const result = await db.query(
      `SELECT 
                COALESCE(AVG(rating), 0) as average,
                COUNT(*) as total,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
             FROM ratings 
             WHERE game_id = $1`,
      [gameId]
    );
    return result.rows[0];
  },

  /**
   * Delete rating
   * @param {number} userId - User ID
   * @param {number} gameId - Game ID
   * @returns {Promise<boolean>} True jika berhasil
   */
  delete: async (userId, gameId) => {
    const result = await db.query(
      "DELETE FROM ratings WHERE user_id = $1 AND game_id = $2",
      [userId, gameId]
    );
    return result.rowCount > 0;
  },
};
