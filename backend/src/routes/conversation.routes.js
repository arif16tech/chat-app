import { Router } from "express";
import {
  getConversations, findOrCreateConversation, clearConversation,
} from "../controllers/conversation.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/", getConversations);
router.post("/", findOrCreateConversation);
router.delete("/:id/clear", clearConversation);

export default router;
