const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddlewares");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many login attempts. Try again later.",
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: "Too many accounts created from this IP.",
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                    // only 5 attempts per 15 min — OTP is very sensitive
  message: "Too many attempts. Please try again later.",
});

// Auth routes
router.post("/signup", signupLimiter, authController.signup);
router.post("/login", loginLimiter, authController.login);
// Password reset
router.post("/send-otp", otpLimiter, userController.sendOTP);
router.post("/verify-otp", otpLimiter, userController.verifyOTP);
router.post("/reset-password/:token", otpLimiter, userController.resetPassword);

// Logged in users
router.get("/me", protect, userController.getMe);
router.patch("/me", protect, userController.updateMe);
router.patch("/me/password", protect, userController.updatePassword);

// Admin only
router.get("/", protect, restrictTo("admin"), userController.getAllUsers);
router.delete("/:id", protect, restrictTo("admin"), userController.deleteUser);
router.get("/totalUsers", protect, restrictTo("admin"), userController.totalUsers);



module.exports = router;