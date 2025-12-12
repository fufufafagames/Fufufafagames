/**
 * Profile Controller
 * Handle user profile operations
 */

const User = require("../models/User");
const Game = require("../models/Game");
const supabase = require('../config/supabase');
const slugify = require('slugify');

module.exports = {
  /**
   * Display user profile
   */
  show: async (req, res) => {
    // ... (rest of show method)
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
      let avatarUrl = avatar; // Default to URL input

      // Handle File Upload
      if (req.file) {
        if (!supabase) {
          throw new Error('Server configuration error: Supabase Storage is not configured.');
        }

        console.log('Uploading avatar file:', req.file.originalname);
        console.log('Original size:', (req.file.size / 1024 / 1024).toFixed(2) + ' MB');
        
        // Optimize image using sharp
        const sharp = require('sharp');
        const optimizedBuffer = await sharp(req.file.buffer)
          .resize(500, 500, { // Resize to max 500x500
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
          .toBuffer();
          
        console.log('Optimized size:', (optimizedBuffer.length / 1024 / 1024).toFixed(2) + ' MB');

        const fileName = `${req.session.user.id}-${Date.now()}.jpg`; // Force jpg extension
        const filePath = `profiles/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, optimizedBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.error('Supabase upload error:', error);
          throw new Error('Failed to upload image: ' + error.message);
        }

        // Get Public URL
        const { data: publicData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = publicData.publicUrl;
        console.log('New avatar URL:', avatarUrl);
      }

      // Update user
      const updatedUser = await User.update(req.session.user.id, {
        name: name || req.session.user.name,
        avatar: avatarUrl || null,
        bio: bio || null,
      });

      // Update session
      req.session.user.name = updatedUser.name;
      req.session.user.avatar = updatedUser.avatar;

      req.session.success = "Profile updated successfully! 👤";
      res.redirect(`/profile/${req.session.user.id}`);
    } catch (error) {
      console.error("Profile update error:", error);
      req.session.error = error.message || "Failed to update profile";
      res.redirect("/profile/edit/me");
    }
  },
  /**
   * Show settings page
   */
  settings: async (req, res) => {
    try {
      const user = await User.findById(req.session.user.id);
      if (!user) {
        req.session.error = "User not found";
        return res.redirect("/games");
      }

      res.render("users/settings", {
        title: "Account Settings",
        profileUser: user,
      });
    } catch (error) {
      console.error("Settings page error:", error);
      req.session.error = "Failed to load settings";
      res.redirect("/games");
    }
  },

  /**
   * Update password
   */
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.session.user.id;

      // 1. Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        req.session.error = "All fields are required";
        return res.redirect("/profile/settings");
      }

      if (newPassword !== confirmPassword) {
        req.session.error = "New passwords do not match";
        return res.redirect("/profile/settings");
      }

      if (newPassword.length < 6) {
        req.session.error = "Password must be at least 6 characters";
        return res.redirect("/profile/settings");
      }

      // 2. Verify current password
      const user = await User.findById(userId);
      // Need to fetch the actual password hash which is not returned by findById usually for security
      // So we might need a specific method or raw query, but let's check User.js again.
      // User.findById returns: id, name, email, avatar, bio, created_at. NO PASSWORD.
      
      // We need to fetch the password hash.
      // Let's use findByEmail since we have the email in session or user object.
      const userWithPassword = await User.findByEmail(user.email);
      
      if (!userWithPassword.password) {
         // OAuth user trying to set password? Or just no password set.
         // For now, assume standard flow.
         req.session.error = "Cannot change password for this account type";
         return res.redirect("/profile/settings");
      }

      const isMatch = await User.verifyPassword(currentPassword, userWithPassword.password);
      if (!isMatch) {
        req.session.error = "Incorrect current password";
        return res.redirect("/profile/settings");
      }

      // 3. Update password
      await User.updatePassword(userId, newPassword);

      req.session.success = "Password updated successfully! 🔒";
      res.redirect("/profile/settings");
    } catch (error) {
      console.error("Password update error:", error);
      req.session.error = "Failed to update password";
      res.redirect("/profile/settings");
    }
  },
};
