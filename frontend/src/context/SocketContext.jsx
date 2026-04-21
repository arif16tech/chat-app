import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem("token");
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => console.log("🔌 Socket connected"));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    socket.on("user_online", ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    socket.on("user_offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    socket.on("typing_start", ({ userId, conversationId }) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
    });

    socket.on("typing_stop", ({ conversationId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const emitTypingStart = (conversationId) => {
    socketRef.current?.emit("typing_start", { conversationId });
  };

  const emitTypingStop = (conversationId) => {
    socketRef.current?.emit("typing_stop", { conversationId });
  };

  const joinConversation = (conversationId) => {
    socketRef.current?.emit("join_conversation", conversationId);
  };

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit("leave_conversation", conversationId);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        typingUsers,
        emitTypingStart,
        emitTypingStop,
        joinConversation,
        leaveConversation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
};
