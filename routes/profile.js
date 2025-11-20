/**
 * Profile Routes
 * Handle user profile operations
 */

const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const profileController = require("../controllers/profileController");

// View user profile (public)
router.get("/:id", profileController.show);

// Edit own profile (login required)
router.get("/edit/me", isAuthenticated, profileController.edit);
router.put("/update/me", isAuthenticated, profileController.update);

module.exports = router;
