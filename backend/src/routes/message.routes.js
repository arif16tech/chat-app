import { Router } from "express";
import {
  getMessages, sendMessage, markSeen, uploadFile, deleteMessage,
} from "../controllers/message.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { uploadMedia } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { sendMessageSchema } from "../validators/message.validator.js";

const router = Router();
router.use(authMiddleware);

router.get("/:conversationId", getMessages);
router.post("/", validate(sendMessageSchema), sendMessage);
router.put("/seen/:conversationId", markSeen);
router.post("/upload", uploadMedia.single("file"), uploadFile);
router.delete("/:id", deleteMessage);

export default router;
