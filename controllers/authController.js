/**
 * Authentication Controller
 * Handle register, login, logout, OAuth, forgot password logic
 * Final version: Compatible with MGX oauth-callback.ejs
 */

const User = require("../models/User");
const { isAdmin } = require("../middleware/auth");

// Supabase client initialization
let supabase = null;
try {
  const { createClient } = require("@supabase/supabase-js");
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("✅ Supabase client initialized for OAuth");
  }
} catch (error) {
  console.log("⚠️ Supabase client not available:", error.message);
}

module.exports = {
  // ==================== STANDARD AUTH ====================

  /**
   * Show register form
   */
  showRegister: (req, res) => {
    const error = req.session.error;
    const success = req.session.success;
    delete req.session.error;
    delete req.session.success;

    res.render("auth/register", {
      title: "Register",
      error,
      success,
    });
  },

  /**
   * Process registration
   */
  register: async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        req.session.error = "All fields are required";
        return res.redirect("/register");
      }

      if (password !== confirmPassword) {
        req.session.error = "Passwords do not match";
        return res.redirect("/register");
      }

      if (password.length < 8) {
        req.session.error = "Password must be at least 8 characters";
        return res.redirect("/register");
      }

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        req.session.error = "Email already registered";
        return res.redirect("/register");
      }

      // Create new user (password will be hashed in User.create)
      const user = await User.create({ name, email, password });

      // Check if user is admin
      const role = isAdmin(user) ? "admin" : "user";

      // Auto login after registration
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: role,
      };

      req.session.success =
        "Registration successful! Welcome to FUFUFAFAGAMES 🎮";
      res.redirect("/games");
    } catch (error) {
      console.error("Register error:", error);
      req.session.error = "Registration failed. Please try again.";
      res.redirect("/register");
    }
  },

  /**
   * Show login form
   */
  showLogin: (req, res) => {
    const error = req.session.error;
    const success = req.session.success;
    delete req.session.error;
    delete req.session.success;

    res.render("auth/login", {
      title: "Login",
      error,
      success,
    });
  },

  /**
   * Process login
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        req.session.error = "Email and password are required";
        return res.redirect("/login");
      }

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        req.session.error = "Invalid email or password";
        return res.redirect("/login");
      }

      // Check if user has password (OAuth users don't have password)
      if (!user.password) {
        req.session.error =
          "Please login using your OAuth provider (Google/Discord/Github)";
        return res.redirect("/login");
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        req.session.error = "Invalid email or password";
        return res.redirect("/login");
      }

      // Check if user is admin
      const role = isAdmin(user) ? "admin" : "user";

      // Create session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: role,
      };

      req.session.success = "Login successful! Welcome back 🎮";
      res.redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      req.session.error = "Login failed. Please try again.";
      res.redirect("/login");
    }
  },

  /**
   * Logout user
   */
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/login");
    });
  },

  // ==================== OAUTH ====================

  /**
   * OAuth Redirect
   * Redirect user ke Supabase OAuth provider
   */
  oauthRedirect: async (req, res) => {
    try {
      const { provider } = req.params;

      // Validate provider
      const validProviders = ["google", "discord", "github"];
      if (!validProviders.includes(provider)) {
        req.session.error = "Invalid OAuth provider";
        return res.redirect("/login");
      }

      // Check if Supabase is available
      if (!supabase) {
        req.session.error =
          "OAuth not configured. Please use email/password login.";
        return res.redirect("/login");
      }

      // Redirect to Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        // options: {
        //   redirectTo: `${process.env.APP_URL}/auth/callback`,
        // },
      });

      if (error) {
        console.error("OAuth redirect error:", error);
        req.session.error = "OAuth login failed. Please try again.";
        return res.redirect("/login");
      }

      // Redirect to provider
      res.redirect(data.url);
    } catch (error) {
      console.error("OAuth redirect error:", error);
      req.session.error = "OAuth login failed. Please try again.";
      res.redirect("/login");
    }
  },

  /**
   * OAuth Callback
   * Handle callback dari Supabase OAuth
   * Render oauth-callback.ejs untuk extract token dari hash fragment
   */
  // oauthCallback: async (req, res) => {
  //   try {
  //     // Check if Supabase is available
  //     if (!supabase) {
  //       req.session.error = "OAuth not configured";
  //       return res.redirect("/login");
  //     }

  //     // Page ini akan handle token extraction via JavaScript
  //     res.render("auth/oauth-callback", {
  //       title: "Completing Login",
  //     });
  //   } catch (error) {
  //     console.error("OAuth callback error:", error);
  //     req.session.error = "OAuth login failed. Please try again.";
  //     res.redirect("/login");
  //   }
  // },

  /**
   * Process OAuth Callback
   * Process tokens yang dikirim dari client-side oauth-callback.ejs
   * UPDATED: Response format sesuai dengan MGX oauth-callback.ejs
   */
  oauthCallbackProcess: async (req, res) => {
    try {
      const { access_token, refresh_token } = req.body;

      // Validation: access_token harus ada
      if (!access_token) {
        return res.json({
          success: false,
          error: "No access token provided", // ← Field 'error' (bukan 'message')
        });
      }

      // Check if Supabase is available
      if (!supabase) {
        return res.json({
          success: false,
          error: "OAuth not configured", // ← Field 'error'
        });
      }

      // Get user data from Supabase using access token
      const {
        data: { user: oauthUser },
        error: userError,
      } = await supabase.auth.getUser(access_token);

      if (userError || !oauthUser) {
        console.error("OAuth user fetch error:", userError);
        return res.json({
          success: false,
          error: "Failed to fetch user data", // ← Field 'error'
        });
      }

      // Extract user data dari Supabase response
      const email = oauthUser.email;
      const name =
        oauthUser.user_metadata?.full_name ||
        oauthUser.user_metadata?.name ||
        oauthUser.user_metadata?.user_name ||
        email.split("@")[0];
      const avatar =
        oauthUser.user_metadata?.avatar_url ||
        oauthUser.user_metadata?.picture ||
        null;

      // Check if user exists in our database
      let user = await User.findByEmail(email);

      if (!user) {
        // Create new user (OAuth user - tanpa password)
        user = await User.createOAuth({
          name: name,
          email: email,
          avatar: avatar,
        });
        console.log("✅ New OAuth user created:", email);
      } else if (avatar && !user.avatar) {
        // Update avatar jika user sudah ada tapi belum punya avatar
        await User.updateAvatar(user.id, avatar);
        user.avatar = avatar;
        console.log("✅ User avatar updated:", email);
      }

      // Check if user is admin
      const role = isAdmin(user) ? "admin" : "user";

      // Create session
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || avatar,
        role: role,
      };

      req.session.success = "Login successful! Welcome back 🎮";

      // Save session before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.json({
            success: false,
            error: "Failed to create session", // ← Field 'error'
          });
        }

        // SUCCESS response (sesuai format MGX oauth-callback.ejs)
        res.json({
          success: true,
          message: "Login successful",
          redirect: "/", // ← Field 'redirect' untuk oauth-callback.ejs
        });
      });
    } catch (error) {
      console.error("OAuth callback process error:", error);
      res.json({
        success: false,
        error: "OAuth login failed. Please try again.", // ← Field 'error'
      });
    }
  },

  // ==================== FORGOT PASSWORD ====================

  /**
   * Show Forgot Password Form
   */
  showForgotPassword: (req, res) => {
    const error = req.session.error;
    const success = req.session.success;
    delete req.session.error;
    delete req.session.success;

    res.render("auth/forgot-password", {
      title: "Forgot Password",
      error,
      success,
    });
  },

  /**
   * Process Forgot Password
   * Send reset password email via Supabase (Simple & Built-in)
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Validation
      if (!email) {
        req.session.error = "Email is required";
        return res.redirect("/forgot-password");
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not (security best practice)
        req.session.success =
          "If that email exists, we've sent a password reset link.";
        return res.redirect("/login");
      }

      // Check if user has password (OAuth users can't reset password)
      if (!user.password) {
        req.session.error =
          "This account uses OAuth login. Please login using your OAuth provider.";
        return res.redirect("/forgot-password");
      }

      // Check if Supabase is available
      if (!supabase) {
        req.session.error =
          "Password reset not configured. Please contact support.";
        return res.redirect("/forgot-password");
      }

      // Send reset password email via Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL}/reset-password`,
      });

      if (error) {
        console.error("Forgot password error:", error);
        req.session.error = "Failed to send reset email. Please try again.";
        return res.redirect("/forgot-password");
      }

      req.session.success = "Password reset link sent! Check your email inbox.";
      res.redirect("/login");
    } catch (error) {
      console.error("Forgot password error:", error);
      req.session.error = "Failed to send reset email. Please try again.";
      res.redirect("/forgot-password");
    }
  },

  /**
   * Show Reset Password Form
   */
  showResetPassword: (req, res) => {
    const token = req.query.token || "";
    const error = req.session.error;
    const success = req.session.success;
    delete req.session.error;
    delete req.session.success;

    res.render("auth/reset-password", {
      title: "Reset Password",
      token: token,
      error,
      success,
    });
  },

  /**
   * Process Reset Password
   * Update user password using Supabase (Simple & Built-in)
   */
  resetPassword: async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;

      // Validation
      if (!password || !confirmPassword) {
        req.session.error = "All fields are required";
        return res.redirect(`/reset-password?token=${token}`);
      }

      if (password !== confirmPassword) {
        req.session.error = "Passwords do not match";
        return res.redirect(`/reset-password?token=${token}`);
      }

      if (password.length < 8) {
        req.session.error = "Password must be at least 8 characters";
        return res.redirect(`/reset-password?token=${token}`);
      }

      // Check if Supabase is available
      if (!supabase) {
        req.session.error =
          "Password reset not configured. Please contact support.";
        return res.redirect("/login");
      }

      // Update password via Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("Reset password error:", error);
        req.session.error = "Failed to reset password. Token may be expired.";
        return res.redirect("/forgot-password");
      }

      req.session.success =
        "Password reset successful! You can now login with your new password.";
      res.redirect("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      req.session.error = "Failed to reset password. Please try again.";
      res.redirect("/forgot-password");
    }
  },
};
