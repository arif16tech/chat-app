import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// GET /api/users/search?q=
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ users: [] });

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { _id: { $nin: req.user.blockedUsers } },
        {
          $or: [
            { username: { $regex: q.trim(), $options: "i" } },
            { name: { $regex: q.trim(), $options: "i" } },
          ],
        },
      ],
    })
      .select("name username profilePic isOnline lastSeen")
      .limit(20);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name username profilePic isOnline lastSeen blockedUsers"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.name = name.trim();
    await user.save();

    res.json({ message: "Profile updated", user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/users/password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// PUT /api/users/profile-pic
export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const user = await User.findById(req.user._id);

    // Delete old image from Cloudinary
    if (user.profilePicPublicId) {
      await cloudinary.uploader.destroy(user.profilePicPublicId).catch(() => {});
    }

    user.profilePic = req.file.path;
    user.profilePicPublicId = req.file.filename;
    await user.save();

    res.json({ message: "Profile picture updated", profilePic: user.profilePic, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/block/:id
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot block yourself" });
    }

    const user = await User.findById(req.user._id);
    if (user.blockedUsers.includes(id)) {
      return res.status(400).json({ error: "User already blocked" });
    }

    user.blockedUsers.push(id);
    await user.save();
    res.json({ message: "User blocked" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/users/unblock/:id
export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter((uid) => uid.toString() !== id);
    await user.save();
    res.json({ message: "User unblocked" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/users/blocked
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "name username profilePic"
    );
    res.json({ blockedUsers: user.blockedUsers });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
