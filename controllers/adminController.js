/**
 * Admin Controller
 * Handle Dashboard, User Management, and Site Monitoring
 */

const User = require("../models/User");
const Game = require("../models/Game");
const Event = require("../models/Event");
const fs = require('fs');
const path = require('path');
const db = require("../config/database");

module.exports = {
  // ==================== DASHBOARD ====================
  
  /**
   * Admin Dashboard specific implementation
   */
  dashboard: async (req, res) => {
    try {
      // 1. Get Quick Stats
      const [userCount, gameCount, playCount] = await Promise.all([
        db.query("SELECT COUNT(*) FROM users"),
        db.query("SELECT COUNT(*) FROM games"),
        db.query("SELECT COALESCE(SUM(play_count), 0) as total FROM games")
      ]);

      const stats = {
        users: parseInt(userCount.rows[0].count),
        games: parseInt(gameCount.rows[0].count),
        plays: parseInt(playCount.rows[0].total)
      };

      // 2. Get Recent Users (Limit 5)
      const recentUsersResult = await db.query(
        "SELECT id, name, email, avatar, created_at, is_banned FROM users ORDER BY created_at DESC LIMIT 5"
      );

      res.render("admin/dashboard", {
        title: "Admin Dashboard",
        page: "dashboard",
        layout: "admin/layout",
        stats,
        recentUsers: recentUsersResult.rows
      });
    } catch (error) {
      console.error("Admin Dashboard Error:", error);
      res.render("error", { 
        title: "Error",
        message: "Failed to load admin dashboard", 
        error 
      });
    }
  },

  // ==================== USER MANAGEMENT ====================

  /**
   * List All Users
   */
  listUsers: async (req, res) => {
    try {
      // Fetch all users
      // Note: In production, you'd want pagination here.
      const users = await User.getAll(); // Ensure User.getAll returns is_banned column if strictly needed there, or duplicate query here if not.
      // User.getAll currently doesn't fetch is_banned, let's fix that query or use a custom one here.
      
      const result = await db.query(`
        SELECT id, name, email, avatar, created_at, is_banned, ban_reason 
        FROM users 
        ORDER BY created_at DESC
      `);
      
      res.render("admin/users", {
        title: "User Management",
        page: "users",
        layout: "admin/layout",
        users: result.rows
      });
    } catch (error) {
      console.error("List Users Error:", error);
      res.status(500).send("Server Error");
    }
  },

  /**
   * Ban User
   */
  banUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      // Prevent banning self
      if (parseInt(userId) === req.session.user.id) {
          req.session.error = "You cannot ban yourself!";
          return res.redirect("/admin/users");
      }

      await User.ban(userId, reason || "Violation of community rules");
      
      req.session.success = "User has been banned successfully.";
      res.redirect("/admin/users");
    } catch (error) {
      console.error("Ban User Error:", error);
      req.session.error = "Failed to ban user.";
      res.redirect("/admin/users");
    }
  },

  /**
   * Unban User
   */
  unbanUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      await User.unban(userId);
      
      req.session.success = "User has been unbanned.";
      res.redirect("/admin/users");
    } catch (error) {
      console.error("Unban User Error:", error);
      req.session.error = "Failed to unban user.";
      res.redirect("/admin/users");
    }
  },

  // ==================== EVENT MANAGEMENT ====================

  /**
   * List All Events
   */
  listEvents: async (req, res) => {
    try {
      const events = await Event.getAll();
      const gamesResult = await require('../config/database').query(`
          SELECT games.id, games.title, games.thumbnail_url, users.name as developer 
          FROM games 
          LEFT JOIN users ON games.user_id = users.id 
          ORDER BY games.title ASC
      `);
      
      res.render("admin/events", {
        title: "Event Management",
        page: "events",
        events,
        games: gamesResult.rows
      });
    } catch (error) {
      console.error("List Events Error:", error);
      res.status(500).send("Server Error");
    }
  },

  /**
   * Create Event
   */
  /**
   * Create Event
   */
  createEvent: async (req, res) => {
    try {
      let { title, description, banner_url, video_url, start_date, end_date } = req.body;
      
      // Auto-generate target_url (Slugify)
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const target_url = `/event/${slug}`;

      // Handle File Uploads
      if (req.files) {
          if (req.files.banner) {
              banner_url = '/' + req.files.banner[0].path.replace(/\\/g, '/').replace(/^public\//, '');
          }
          if (req.files.video) {
              video_url = '/' + req.files.video[0].path.replace(/\\/g, '/').replace(/^public\//, '');
          }
      }
      
      // Game ID is removed per requirement
      const game_id = null;

      await Event.create({ title, description, banner_url, video_url, target_url, start_date, end_date, game_id });
      req.session.success = "Event created successfully!";
      res.redirect("/admin/events");
    } catch (error) {
      console.error("Create Event Error:", error);
      req.session.error = "Failed to create event.";
      res.redirect("/admin/events");
    }
  },

  /**
   * Update Event
   */
  updateEvent: async (req, res) => {
      try {
          const { id } = req.params;
          let { title, description, banner_url, video_url, start_date, end_date } = req.body;
          
          // Auto-generate target_url (Slugify)
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          const target_url = `/event/${slug}`;

          // Fetch old event for cleanup
          const oldEvent = await Event.findById(id);

          // Handle File Uploads
          if (req.files) {
              if (req.files.banner) {
                  // Delete old banner if exists and is local
                  if(oldEvent && oldEvent.banner_url && !oldEvent.banner_url.startsWith('http')) {
                      const oldPath = path.join(__dirname, '../public', oldEvent.banner_url);
                      if(fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                  }
                  banner_url = '/' + req.files.banner[0].path.replace(/\\/g, '/').replace(/^public\//, '');
              }
              if (req.files.video) {
                   // Delete old video if exists and is local
                  if(oldEvent && oldEvent.video_url && !oldEvent.video_url.startsWith('http')) {
                      const oldPath = path.join(__dirname, '../public', oldEvent.video_url);
                      if(fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                  }
                  video_url = '/' + req.files.video[0].path.replace(/\\/g, '/').replace(/^public\//, '');
              }
          }

          const game_id = null;

          await Event.update(id, { title, description, banner_url, video_url, target_url, start_date, end_date, game_id });
          req.session.success = "Event updated successfully!";
          res.redirect("/admin/events");
      } catch (error) {
          console.error("Update Event Error:", error);
          req.session.error = "Failed to update event.";
          res.redirect("/admin/events");
      }
  },

  /**
   * Activate Event
   */
  activateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      await Event.toggleActive(id);
      req.session.success = "Event activated!";
      res.redirect("/admin/events");
    } catch (error) {
       console.error("Activate Event Error:", error);
       req.session.error = "Failed to activate event.";
       res.redirect("/admin/events");
    }
  },

  /**
   * Delete Event
   */
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Cleanup files before deleting
      const oldEvent = await Event.findById(id);
      if (oldEvent) {
          if (oldEvent.banner_url && !oldEvent.banner_url.startsWith('http')) {
               const p = path.join(__dirname, '../public', oldEvent.banner_url);
               if(fs.existsSync(p)) fs.unlinkSync(p);
          }
          if (oldEvent.video_url && !oldEvent.video_url.startsWith('http')) {
               const p = path.join(__dirname, '../public', oldEvent.video_url);
               if(fs.existsSync(p)) fs.unlinkSync(p);
          }
      }

      await Event.delete(id);
      req.session.success = "Event deleted.";
      res.redirect("/admin/events");
    } catch (error) {
      console.error("Delete Event Error:", error);
      req.session.error = "Failed to delete event.";
      res.redirect("/admin/events");
    }
  }
};
