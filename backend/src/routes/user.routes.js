import { Router } from "express";
import {
  searchUsers, getUserById, updateProfile,
  updatePassword, updateProfilePic,
  blockUser, unblockUser, getBlockedUsers,
} from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { uploadProfilePic } from "../middleware/upload.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/search", searchUsers);
router.get("/blocked", getBlockedUsers);
router.get("/:id", getUserById);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);
router.put("/profile-pic", uploadProfilePic.single("profilePic"), updateProfilePic);
router.post("/block/:id", blockUser);
router.post("/unblock/:id", unblockUser);

export default router;
