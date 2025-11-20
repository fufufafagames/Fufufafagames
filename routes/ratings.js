/**
 * Rating Routes
 * Handle rating submissions
 */

const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const {
  ratingValidation,
  handleValidationErrors,
} = require("../middleware/validation");
const ratingController = require("../controllers/ratingController");

// Submit rating (login required)
router.post(
  "/",
  isAuthenticated,
  ratingValidation,
  handleValidationErrors,
  ratingController.store
);

// Delete rating (login required)
router.delete("/:gameId", isAuthenticated, ratingController.destroy);

module.exports = router;
