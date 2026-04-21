import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // For 1-to-1
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // For group
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    text: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    fileType: { type: String, enum: ["image", "video", "file", ""], default: "" },
    fileName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
