import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/chat/Sidebar.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import WelcomeScreen from "../components/chat/WelcomeScreen.jsx";
import api from "../api/axios.js";

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch sidebar conversations
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/conversations");
      setConversations(data.conversations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Real-time: new message updates sidebar
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversation
            ? {
                ...c,
                lastMessage: msg,
                updatedAt: new Date().toISOString(),
                unreadCount: activeConversation?._id === msg.conversation
                  ? 0
                  : (c.unreadCount || 0) + 1,
              }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const handleConvUpdated = ({ conversationId, lastMessage, unreadCount }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage, unreadCount: activeConversation?._id === conversationId ? 0 : unreadCount, updatedAt: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    const handleGroupCreated = ({ conversationId }) => {
      fetchConversations();
    };

    socket.on("new_message", handleNewMessage);
    socket.on("conversation_updated", handleConvUpdated);
    socket.on("group_created", handleGroupCreated);
    socket.on("added_to_group", fetchConversations);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("conversation_updated", handleConvUpdated);
      socket.off("group_created", handleGroupCreated);
      socket.off("added_to_group", fetchConversations);
    };
  }, [socket, activeConversation, fetchConversations]);

  const handleSelectConversation = (conv) => {
    if (activeConversation?._id) leaveConversation(activeConversation._id);
    setActiveConversation(conv);
    joinConversation(conv._id);
    // Clear unread count locally
    setConversations((prev) =>
      prev.map((c) => c._id === conv._id ? { ...c, unreadCount: 0 } : c)
    );
    // Mobile: hide sidebar
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleNewConversation = (conv) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c._id === conv._id);
      if (exists) return prev;
      return [conv, ...prev];
    });
    handleSelectConversation(conv);
  };

  const handleBack = () => {
    setSidebarOpen(true);
    if (activeConversation?._id) leaveConversation(activeConversation._id);
    setActiveConversation(null);
  };

  return (
    <div className="h-screen flex bg-surface-900 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || window.innerWidth >= 768) && (
          <motion.div
            key="sidebar"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col border-r border-surface-700 md:relative absolute inset-y-0 left-0 z-20 bg-surface-900"
          >
            <Sidebar
              conversations={conversations}
              loading={loadingConvs}
              activeId={activeConversation?._id}
              onSelect={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onConversationsChange={setConversations}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConversation ? (
          <ChatWindow
            key={activeConversation._id}
            conversation={activeConversation}
            onBack={handleBack}
            onConversationUpdate={(updated) => {
              setActiveConversation(updated);
              setConversations((prev) =>
                prev.map((c) => c._id === updated._id ? { ...c, ...updated } : c)
              );
            }}
          />
        ) : (
          <WelcomeScreen user={user} />
        )}
      </div>
    </div>
  );
}
