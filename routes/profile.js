/**
 * Profile Routes
 * Handle user profile operations
 */

const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const profileController = require("../controllers/profileController");

// Account Settings
router.get("/settings", isAuthenticated, profileController.settings);
router.put("/settings/password", isAuthenticated, profileController.updatePassword);

// View user profile (public)
router.get("/:id", profileController.show);

const multer = require('multer');

// Configure multer for memory storage (we will upload to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to handle multer errors gracefully
const uploadMiddleware = (req, res, next) => {
  const uploadSingle = upload.single('avatarFile');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if (err.code === 'LIMIT_FILE_SIZE') {
          req.session.error = 'File too large. Maximum size is 20MB.';
        } else {
          req.session.error = `Upload error: ${err.message}`;
        }
      } else if (err) {
        // An unknown error occurred when uploading.
        req.session.error = err.message;
      }
      return res.redirect('/profile/edit/me');
    }
    // Everything went fine.
    next();
  });
};

// Edit own profile (login required)
router.get("/edit/me", isAuthenticated, profileController.edit);
router.put("/update/me", isAuthenticated, uploadMiddleware, profileController.update);

module.exports = router;
