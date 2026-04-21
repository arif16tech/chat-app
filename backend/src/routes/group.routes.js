import { Router } from "express";
import {
  createGroup, getGroup, updateGroup,
  addMember, removeMember, leaveGroup, transferAdmin,
} from "../controllers/group.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { uploadGroupAvatar } from "../middleware/upload.middleware.js";

const router = Router();
router.use(authMiddleware);

router.post("/", createGroup);
router.get("/:id", getGroup);
router.put("/:id", uploadGroupAvatar.single("avatar"), updateGroup);
router.post("/:id/add-member", addMember);
router.post("/:id/remove-member", removeMember);
router.post("/:id/leave", leaveGroup);
router.put("/:id/transfer-admin", transferAdmin);

export default router;
