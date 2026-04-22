import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getSocketId, getIO } from "../socket/socket.js";

// GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 25 } = req.query;

    const conv = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id,
    });
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const skip = (Number(page) - 1) * Number(limit);
    let messages = await Message.find({
      conversation: conversationId,
      deletedFor: { $ne: req.user._id },
    })
      .populate("sender", "name username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Reverse so the newest messages are at the bottom for the frontend
    messages = messages.reverse();

    // Mark undelivered messages as delivered
    const undelivered = messages.filter(
      (m) => m.status === "sent" && m.sender._id.toString() !== req.user._id.toString()
    );
    if (undelivered.length) {
      await Message.updateMany(
        { _id: { $in: undelivered.map((m) => m._id) } },
        { $set: { status: "delivered" } }
      );
      undelivered.forEach((m) => (m.status = "delivered"));
    }

    // Reset unread count for this user
    conv.unreadCounts.set(req.user._id.toString(), 0);
    await conv.save();

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedFor: { $ne: req.user._id },
    });

    res.json({ messages, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, fileUrl, fileType, fileName } = req.body;

    const conv = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id,
    }).populate("members", "_id blockedUsers");
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    // Block check for 1-to-1
    if (!conv.isGroup) {
      const otherMember = conv.members.find(
        (m) => m._id.toString() !== req.user._id.toString()
      );
      if (
        otherMember?.blockedUsers?.some((id) => id.toString() === req.user._id.toString()) ||
        req.user.blockedUsers?.some((id) => id.toString() === otherMember?._id.toString())
      ) {
        return res.status(403).json({ error: "Cannot send message to this user" });
      }
    }

    const receiver = conv.isGroup
      ? null
      : conv.members.find((m) => m._id.toString() !== req.user._id.toString())?._id;

    const message = await Message.create({
      sender: req.user._id,
      receiver,
      group: conv.group || null,
      conversation: conversationId,
      text: text || "",
      fileUrl: fileUrl || "",
      fileType: fileType || "",
      fileName: fileName || "",
      status: "sent",
    });

    await message.populate("sender", "name username profilePic");

    // Update conversation lastMessage + unread counts
    conv.lastMessage = message._id;
    conv.members.forEach((m) => {
      if (m._id.toString() !== req.user._id.toString()) {
        const current = conv.unreadCounts.get(m._id.toString()) || 0;
        conv.unreadCounts.set(m._id.toString(), current + 1);
      }
    });
    conv.updatedAt = new Date();
    await conv.save();

    // Emit via socket
    const io = getIO();
    conv.members.forEach((m) => {
      const sid = getSocketId(m._id.toString());
      if (sid && m._id.toString() !== req.user._id.toString()) {
        io.to(sid).emit("new_message", message);
        io.to(sid).emit("conversation_updated", {
          conversationId,
          lastMessage: message,
          unreadCount: conv.unreadCounts.get(m._id.toString()) || 0,
        });
      }
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/messages/seen/:conversationId
export const markSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const updated = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        status: { $ne: "seen" },
      },
      { $set: { status: "seen" }, $addToSet: { seenBy: req.user._id } }
    );

    // Reset unread count
    const conv = await Conversation.findById(conversationId);
    if (conv) {
      conv.unreadCounts.set(req.user._id.toString(), 0);
      await conv.save();
    }

    // Notify sender(s) via socket
    const io = getIO();
    const seenMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: req.user._id },
      seenBy: req.user._id,
    }).select("sender _id");

    const senderIds = [...new Set(seenMessages.map((m) => m.sender.toString()))];
    senderIds.forEach((senderId) => {
      const sid = getSocketId(senderId);
      if (sid) {
        io.to(sid).emit("messages_seen", { conversationId, seenBy: req.user._id });
      }
    });

    res.json({ message: "Marked as seen", modified: updated.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/messages/upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const ext = req.file.originalname?.split(".").pop()?.toLowerCase();
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    const videoExts = ["mp4", "mov", "avi", "webm"];

    let fileType = "file";
    if (imageExts.includes(ext)) fileType = "image";
    else if (videoExts.includes(ext)) fileType = "video";

    res.json({
      fileUrl: req.file.path,
      fileType,
      fileName: req.file.originalname,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findOne({ _id: req.params.id, sender: req.user._id });
    if (!msg) return res.status(404).json({ error: "Message not found" });

    msg.deletedFor.push(req.user._id);
    if (msg.text) msg.text = "";
    await msg.save();

    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
