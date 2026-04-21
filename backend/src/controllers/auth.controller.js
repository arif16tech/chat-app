import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { generateOtp, otpExpiry } from "../utils/otp.js";
import { sendOtpEmail } from "../config/email.js";

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username: username.toLowerCase() }] });
    if (exists) {
      const field = exists.email === email ? "email" : "username";
      return res.status(409).json({ error: `This ${field} is already taken` });
    }

    const otp = generateOtp();
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password,
      otp,
      otpExpiry: otpExpiry(10),
    });

    await sendOtpEmail(email, otp, "verification");

    res.status(201).json({
      message: "Account created! Check your email for the verification OTP.",
      userId: user._id,
    });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Already verified" });

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = signToken({ id: user._id });
    res.json({ message: "Email verified successfully!", token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Already verified" });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = otpExpiry(10);
    await user.save();

    await sendOtpEmail(email, otp, "verification");
    res.json({ message: "OTP resent to your email" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const isEmail = identifier.includes("@");

    const user = await User.findOne(
      isEmail ? { email: identifier } : { username: identifier.toLowerCase() }
    );
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user._id });
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond 200 to avoid email enumeration
    if (!user || !user.isVerified) {
      return res.json({ message: "If that email exists, an OTP was sent." });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = otpExpiry(10);
    await user.save();

    await sendOtpEmail(email, otp, "reset");
    res.json({ message: "If that email exists, an OTP was sent." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful. Please login." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};
