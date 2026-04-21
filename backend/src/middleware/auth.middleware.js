import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password -otp -otpExpiry");
    if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });
    if (!user.isVerified) return res.status(403).json({ error: "Please verify your email first" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

export default authMiddleware;
