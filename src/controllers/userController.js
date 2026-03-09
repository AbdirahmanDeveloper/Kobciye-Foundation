const User = require("../models/User");
const Member = require("../models/members");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs"); // ← fixed: was "bycrpt" AND aliased wrong

// Get All users (only Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ status: "success", results: users.length, data: users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get me
exports.getMe = async (req, res) => {
  res.status(200).json({ status: "success", data: req.user });
};

// Update user name/email
exports.updateMe = async (req, res) => {
  try {
    const allowedFields = ["name", "email"];
    const updates = {};
    Object.keys(req.body).forEach((field) => {
      if (allowedFields.includes(field)) updates[field] = req.body[field];
    });

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ status: "success", data: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update password (logged-in user)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "All password fields are required" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "New passwords do not match" });

    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    const user = await User.findById(req.user._id).select("+password");
    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect)
      return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ status: "success", message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get total users
exports.totalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ status: "success", data: { totalUsers } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get total members
exports.getAllMembers = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    res.status(200).json({ status: "success", data: { totalMembers } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Please provide your email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with that email" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    user.passwordResetOTP = crypto.createHash("sha256").update(otp).digest("hex");
    user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: `"Kobciye Foundation" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Reset Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:30px;border-radius:12px;border:1px solid #e5e7eb;">
          <h2 style="color:#2575fc;">Password Reset Code</h2>
          <p style="color:#555;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:2.5rem;font-weight:800;letter-spacing:12px;text-align:center;color:#0f0e0c;background:#f0f5ff;padding:20px;border-radius:10px;">
            ${otp}
          </div>
          <p style="margin-top:24px;color:#9ca3af;font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>`,
    });

    res.status(200).json({ status: "success", message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      passwordResetOTP: hashedOTP,
      passwordResetOTPExpires: { $gt: Date.now() },
    }).select("+passwordResetOTP +passwordResetOTPExpires");

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: "success", message: "OTP verified", token: resetToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset password using token (after OTP verified)  ← FIXED & COMPLETED
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword)
      return res.status(400).json({ message: "Both password fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    // Hash the incoming raw token and look it up
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) return res.status(400).json({ message: "Token is invalid or has expired" });

    user.password = await bcrypt.hash(password, 12); // ← await was missing before
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ status: "success", message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};