/**
 * Rating Controller
 * Handle rating submissions
 */

const Rating = require("../models/Rating");
const Game = require("../models/Game");

module.exports = {
  /**
   * Submit or update rating
   */
  store: async (req, res) => {
    try {
      const { game_id, rating, review } = req.body;
      const user_id = req.session.user.id;

      // Verify game exists
      const game = await Game.findById(game_id);
      if (!game) {
        req.session.error = "Game not found";
        return res.redirect("/games");
      }

      // Create or update rating
      await Rating.createOrUpdate({
        user_id,
        game_id,
        rating: parseInt(rating),
        review: review || null,
      });

      // Update game's average rating
      await Game.updateAverageRating(game_id);

      req.session.success = "Rating submitted successfully! ⭐";
      res.redirect(`/games/${game.slug}`);
    } catch (error) {
      console.error("Rating store error:", error);
      req.session.error = "Failed to submit rating. Please try again.";
      res.redirect("back");
    }
  },

  /**
   * Delete rating
   */
  destroy: async (req, res) => {
    try {
      const game_id = req.params.gameId;
      const user_id = req.session.user.id;

      // Verify game exists
      const game = await Game.findById(game_id);
      if (!game) {
        req.session.error = "Game not found";
        return res.redirect("/games");
      }

      // Delete rating
      await Rating.delete(user_id, game_id);

      // Update game's average rating
      await Game.updateAverageRating(game_id);

      req.session.success = "Rating deleted successfully";
      res.redirect(`/games/${game.slug}`);
    } catch (error) {
      console.error("Rating delete error:", error);
      req.session.error = "Failed to delete rating";
      res.redirect("back");
    }
  },
};
