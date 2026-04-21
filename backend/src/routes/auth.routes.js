import { Router } from "express";
import {
  signup, verifyOtp, resendOtp, login,
  forgotPassword, resetPassword, getMe,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  signupSchema, loginSchema, verifyOtpSchema,
  forgotPasswordSchema, resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.get("/me", authMiddleware, getMe);

export default router;
