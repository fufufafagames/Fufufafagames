/**
 * Authentication Middleware
 * Middleware untuk protect routes yang memerlukan login
 */

/**
 * Admin Credentials
 * List email dan username yang dianggap sebagai admin
 */
const ADMIN_CREDENTIALS = [
  "fufufafagames.id",
  "fufufafagames@gmail.com",
  "fufufafagames", // untuk Github/Discord username
];

/**
 * Check if user is admin
 * @param {Object} user - User object dengan email atau user_metadata
 * @returns {boolean} - true jika user adalah admin
 */
function isAdmin(user) {
  if (!user) return false;

  // Check email
  if (user.email && ADMIN_CREDENTIALS.includes(user.email)) {
    return true;
  }

  // Check username dari OAuth providers (Github/Discord)
  if (
    user.user_metadata &&
    user.user_metadata.user_name &&
    ADMIN_CREDENTIALS.includes(user.user_metadata.user_name)
  ) {
    return true;
  }

  return false;
}

module.exports = {
  /**
   * Check apakah user sudah login
   * Jika belum, redirect ke halaman login
   */
  isAuthenticated: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.session.error = "Please login to access this page";
    res.redirect("/login");
  },

  /**
   * Check apakah user belum login (untuk halaman login/register)
   * Jika sudah login, redirect ke homepage
   */
  isGuest: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    res.redirect("/games");
  },

  /**
   * Check apakah user adalah owner dari resource
   * @param {number} resourceUserId - User ID dari resource owner
   */
  isOwner: (resourceUserId) => {
    return (req, res, next) => {
      if (req.session.user && req.session.user.id === resourceUserId) {
        return next();
      }
      req.session.error = "You are not authorized to perform this action";
      res.redirect("/games");
    };
  },

  /**
   * Check if user is admin
   * Middleware untuk protect admin-only routes
   */
  isAdminMiddleware: (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") {
      return next();
    }
    req.session.error = "Admin access required";
    res.redirect("/games");
  },

  /**
   * Export isAdmin function untuk digunakan di controller
   */
  isAdmin: isAdmin,
};
