import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// GET /api/conversations  — sidebar list
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ members: req.user._id })
      .populate("members", "name username profilePic isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name username" },
      })
      .populate("group", "name avatar")
      .sort({ updatedAt: -1 });

    // Attach unread count for current user
    const result = conversations.map((c) => {
      const obj = c.toObject();
      obj.unreadCount = c.unreadCounts?.get?.(req.user._id.toString()) || 0;
      return obj;
    });

    res.json({ conversations: result });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/conversations  — find or create 1-to-1
export const findOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot create conversation with yourself" });
    }

    const otherUser = await User.findById(userId).select("name username profilePic isOnline lastSeen blockedUsers");
    if (!otherUser) return res.status(404).json({ error: "User not found" });

    // Block check
    if (otherUser.blockedUsers?.includes(req.user._id) || req.user.blockedUsers?.includes(userId)) {
      return res.status(403).json({ error: "Cannot start conversation with this user" });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate("members", "name username profilePic isOnline lastSeen")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({ members: [req.user._id, userId] });
      conversation = await Conversation.findById(conversation._id)
        .populate("members", "name username profilePic isOnline lastSeen")
        .populate("lastMessage");
    }

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/conversations/:id — clear for current user
export const clearConversation = async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, members: req.user._id });
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    await Message.updateMany(
      { conversation: conv._id },
      { $addToSet: { deletedFor: req.user._id } }
    );

    res.json({ message: "Conversation cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
