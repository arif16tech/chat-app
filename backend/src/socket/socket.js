import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

let io;
const userSocketMap = {}; // userId → socketId

export const getIO = () => io;
export const getSocketId = (userId) => userSocketMap[userId];

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth Middleware ────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Unauthorized: No token"));

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Unauthorized: User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized: Invalid token"));
    }
  });

  // ── Connection ─────────────────────────────────────────────────────────────
  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    userSocketMap[userId] = socket.id;

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    io.emit("user_online", { userId });

    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ── Join rooms ─────────────────────────────────────────────────────────
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // ── Typing Indicators ─────────────────────────────────────────────────
    socket.on("typing_start", ({ conversationId }) => {
      socket.to(conversationId).emit("typing_start", {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on("typing_stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing_stop", { userId, conversationId });
    });

    // ── Message Seen ───────────────────────────────────────────────────────
    socket.on("message_seen", ({ conversationId, senderId }) => {
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_seen", { conversationId, seenBy: userId });
      }
    });

    // ── Message Delivered ─────────────────────────────────────────────────
    socket.on("message_delivered", async ({ messageId, senderId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "delivered" });
      } catch (err) {
        console.error("Failed to update message status to delivered:", err);
      }
      
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_delivered", { messageId, deliveredTo: userId });
      }
    });

    // ── Call Signaling (WebRTC ready) ─────────────────────────────────────
    socket.on("call_offer", ({ to, offer }) => {
      const toSocketId = userSocketMap[to];
      if (toSocketId) io.to(toSocketId).emit("call_offer", { from: userId, offer });
    });

    socket.on("call_answer", ({ to, answer }) => {
      const toSocketId = userSocketMap[to];
      if (toSocketId) io.to(toSocketId).emit("call_answer", { from: userId, answer });
    });

    socket.on("ice_candidate", ({ to, candidate }) => {
      const toSocketId = userSocketMap[to];
      if (toSocketId) io.to(toSocketId).emit("ice_candidate", { from: userId, candidate });
    });

    socket.on("call_end", ({ to }) => {
      const toSocketId = userSocketMap[to];
      if (toSocketId) io.to(toSocketId).emit("call_ended", { from: userId });
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      delete userSocketMap[userId];
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit("user_offline", { userId, lastSeen: new Date() });
      console.log(`❌ Socket disconnected: ${socket.user.username}`);
    });
  });

  return io;
};
