import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "../api/axios.js";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpw
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent if that email exists");
      setStep(2);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error("All fields required");
    if (newPassword.length < 6) return toast.error("Password min 6 characters");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Password reset! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-card p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">
            {step === 1 ? "Enter your email to receive a reset OTP" : "Enter the OTP and your new password"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </motion.form>
          ) : (
            <motion.form key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">OTP Code</label>
                <input type="text" inputMode="numeric" maxLength={6} className="input-field tracking-widest text-center text-lg font-bold" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input type="password" className="input-field" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full">Back</button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-slate-400 mt-6">
          Remember it?{" "}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
