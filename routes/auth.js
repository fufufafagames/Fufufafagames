/**
 * Authentication Routes
 * Handle register, login, logout, OAuth, forgot password
 */

const express = require("express");
const router = express.Router();
const { isGuest } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const authController = require("../controllers/authController");

// ==================== STANDARD AUTH ROUTES ====================

// Show register form
router.get("/register", isGuest, authController.showRegister);

// Process registration
router.post(
  "/register",
  isGuest,
  registerValidation,
  handleValidationErrors,
  authController.register
);

// Show login form
router.get("/login", isGuest, authController.showLogin);

// Process login
router.post(
  "/login",
  isGuest,
  loginValidation,
  handleValidationErrors,
  authController.login
);

// Logout
router.get("/logout", authController.logout);

// ==================== OAUTH ROUTES ====================

/**
 * OAuth Login/Register
 * Redirect user ke Supabase OAuth provider
 * Supported providers: google, discord, github
 */
router.get("/auth/:provider", isGuest, authController.oauthRedirect);

/**
 * OAuth Callback
 * Handle callback dari Supabase OAuth
 * Render halaman yang akan extract tokens dari hash fragment
 */
// router.get("/auth/callback", authController.oauthCallback);

/**
 * OAuth Callback Process
 * Process tokens yang dikirim dari client-side
 */
router.post("/auth/callback/process", authController.oauthCallbackProcess);

// ==================== FORGOT PASSWORD ROUTES ====================

/**
 * Show Forgot Password Form
 */
router.get("/forgot-password", isGuest, authController.showForgotPassword);

/**
 * Process Forgot Password
 * Send reset password email via Supabase
 */
router.post("/forgot-password", isGuest, authController.forgotPassword);

/**
 * Show Reset Password Form
 * Token will be in query params: /reset-password?token=xxx
 */
router.get("/reset-password", authController.showResetPassword);

/**
 * Process Reset Password
 * Update user password using Supabase
 */
router.post("/reset-password", authController.resetPassword);

module.exports = router;
