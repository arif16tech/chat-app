import Group from "../models/Group.js";
import Conversation from "../models/Conversation.js";
import cloudinary from "../config/cloudinary.js";
import { getSocketId, getIO } from "../socket/socket.js";

// POST /api/groups
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name || !memberIds?.length) {
      return res.status(400).json({ error: "Name and at least one member required" });
    }

    const allMembers = [...new Set([req.user._id.toString(), ...memberIds])];

    // Create conversation first
    const conversation = await Conversation.create({
      isGroup: true,
      members: allMembers,
    });

    const group = await Group.create({
      name,
      description: description || "",
      admin: req.user._id,
      members: allMembers,
      conversation: conversation._id,
    });

    conversation.group = group._id;
    await conversation.save();

    const populated = await Group.findById(group._id)
      .populate("members", "name username profilePic isOnline lastSeen")
      .populate("admin", "name username profilePic");

    // Notify members
    const io = getIO();
    allMembers.forEach((uid) => {
      const sid = getSocketId(uid.toString());
      if (sid) io.to(sid).emit("group_created", { group: populated, conversationId: conversation._id });
    });

    res.status(201).json({ group: populated, conversationId: conversation._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/groups/:id
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("members", "name username profilePic isOnline lastSeen")
      .populate("admin", "name username profilePic");
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isMember = group.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: "Not a group member" });

    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/groups/:id
export const updateGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only admin can update group" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    if (req.file) {
      if (group.avatarPublicId) {
        await cloudinary.uploader.destroy(group.avatarPublicId).catch(() => {});
      }
      group.avatar = req.file.path;
      group.avatarPublicId = req.file.filename;
    }

    await group.save();
    const populated = await Group.findById(group._id)
      .populate("members", "name username profilePic isOnline lastSeen")
      .populate("admin", "name username profilePic");

    res.json({ group: populated });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/groups/:id/add-member
export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only admin can add members" });
    }
    if (group.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({ error: "User already a member" });
    }

    group.members.push(userId);
    await group.save();

    await Conversation.findByIdAndUpdate(group.conversation, {
      $addToSet: { members: userId },
    });

    const io = getIO();
    const sid = getSocketId(userId);
    if (sid) {
      io.to(sid).emit("added_to_group", { groupId: group._id, conversationId: group.conversation });
    }

    res.json({ message: "Member added" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/groups/:id/remove-member
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only admin can remove members" });
    }
    if (userId === group.admin.toString()) {
      return res.status(400).json({ error: "Cannot remove the admin" });
    }

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    await Conversation.findByIdAndUpdate(group.conversation, {
      $pull: { members: userId },
    });

    const io = getIO();
    const sid = getSocketId(userId);
    if (sid) io.to(sid).emit("removed_from_group", { groupId: group._id });

    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/groups/:id/leave
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(400).json({ error: "Not a member" });

    if (group.admin.toString() === req.user._id.toString() && group.members.length > 1) {
      return res.status(400).json({ error: "Transfer admin before leaving" });
    }

    group.members = group.members.filter((m) => m.toString() !== req.user._id.toString());

    if (group.members.length === 0) {
      await Conversation.findByIdAndDelete(group.conversation);
      await group.deleteOne();
      return res.json({ message: "Group deleted (no members left)" });
    }

    await group.save();
    await Conversation.findByIdAndUpdate(group.conversation, {
      $pull: { members: req.user._id },
    });

    res.json({ message: "Left group successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/groups/:id/transfer-admin
export const transferAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only admin can transfer admin" });
    }
    if (!group.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({ error: "New admin must be a group member" });
    }

    group.admin = userId;
    await group.save();
    res.json({ message: "Admin transferred" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
