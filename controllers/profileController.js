/**
 * Profile Controller
 * Handle user profile operations
 */

const User = require("../models/User");
const Game = require("../models/Game");

module.exports = {
  /**
   * Display user profile
   */
  show: async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Get user data
      const user = await User.findById(userId);
      if (!user) {
        req.session.error = "User not found";
        return res.redirect("/games");
      }

      // Get user's uploaded games
      const games = await Game.getByUserId(userId);

      // Get user stats
      const stats = await User.getStats(userId);

      res.render("profile/show", {
        title: `${user.name}'s Profile`,
        profileUser: user,
        games,
        stats,
      });
    } catch (error) {
      console.error("Profile show error:", error);
      req.session.error = "Failed to load profile";
      res.redirect("/games");
    }
  },

  /**
   * Show edit profile form
   */
  edit: async (req, res) => {
    try {
      const user = await User.findById(req.session.user.id);
      if (!user) {
        req.session.error = "User not found";
        return res.redirect("/games");
      }

      res.render("profile/edit", {
        title: "Edit Profile",
        profileUser: user,
      });
    } catch (error) {
      console.error("Profile edit error:", error);
      req.session.error = "Failed to load profile";
      res.redirect("/games");
    }
  },

  /**
   * Update profile
   */
  update: async (req, res) => {
    try {
      const { name, avatar, bio } = req.body;

      // Update user
      const updatedUser = await User.update(req.session.user.id, {
        name: name || req.session.user.name,
        avatar: avatar || null,
        bio: bio || null,
      });

      // Update session
      req.session.user.name = updatedUser.name;
      req.session.user.avatar = updatedUser.avatar;

      req.session.success = "Profile updated successfully! 👤";
      res.redirect(`/profile/${req.session.user.id}`);
    } catch (error) {
      console.error("Profile update error:", error);
      req.session.error = "Failed to update profile";
      res.redirect("/profile/edit/me");
    }
  },
};
