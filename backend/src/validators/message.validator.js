import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  text: z.string().max(2000).optional(),
  fileUrl: z.string().url().optional(),
  fileType: z.enum(["image", "video", "file", ""]).optional(),
  fileName: z.string().optional(),
}).refine((d) => d.text || d.fileUrl, {
  message: "Message must have text or a file",
});
