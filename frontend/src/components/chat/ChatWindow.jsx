import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import dayjs from "../../utils/dayjs.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import Avatar from "../shared/Avatar.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageInput from "./MessageInput.jsx";
import Spinner from "../shared/Spinner.jsx";
import GroupInfoModal from "../modals/GroupInfoModal.jsx";
import api from "../../api/axios.js";

export default function ChatWindow({ conversation, onBack, onConversationUpdate }) {
  const { user } = useAuth();
  const { socket, onlineUsers, typingUsers, emitTypingStart, emitTypingStop } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const isGroup = conversation.isGroup;
  const other = !isGroup && conversation.members?.find((m) => m._id !== user._id);
  const name = isGroup ? conversation.group?.name : other?.name;
  const avatar = isGroup ? conversation.group?.avatar : other?.profilePic;
  const isOnline = !isGroup && onlineUsers.includes(other?._id);
  const isTyping = !!typingUsers[conversation._id];

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/messages/${conversation._id}?page=1&limit=50`);
      setMessages(data.messages);
      setPage(1);
      setHasMore(1 < data.pages);
      await api.put(`/messages/seen/${conversation._id}`);
    } catch { toast.error("Failed to load messages"); }
    finally { setLoading(false); }
  }, [conversation._id]);

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const scrollContainer = scrollRef.current;
      const previousScrollHeight = scrollContainer?.scrollHeight || 0;

      const nextPage = page + 1;
      const { data } = await api.get(`/messages/${conversation._id}?page=${nextPage}&limit=50`);
      
      setMessages((prev) => [...data.messages, ...prev]);
      setPage(nextPage);
      setHasMore(nextPage < data.pages);

      // Restore scroll position gracefully
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight - previousScrollHeight;
        }
      });
    } catch {
      toast.error("Failed to load older messages");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => { 
    if (page === 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }); 
    }
  }, [messages, isTyping, page]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (msg) => {
      if (msg.conversation !== conversation._id) return;
      setMessages((prev) => [...prev, msg]);
      api.put(`/messages/seen/${conversation._id}`).catch(() => {});
    };
    const handleSeen = ({ conversationId }) => {
      if (conversationId !== conversation._id) return;
      setMessages((prev) => prev.map((m) => m.sender._id === user._id ? { ...m, status: "seen" } : m));
    };
    const handleDelivered = ({ messageId }) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, status: "delivered" } : m));
    };

    socket.on("new_message", handleNew);
    socket.on("messages_seen", handleSeen);
    socket.on("message_delivered", handleDelivered);
    return () => {
      socket.off("new_message", handleNew);
      socket.off("messages_seen", handleSeen);
      socket.off("message_delivered", handleDelivered);
    };
  }, [socket, conversation._id, user._id]);

  const sendMessage = async ({ text, fileUrl, fileType, fileName }) => {
    if (sending) return;
    setSending(true);
    try {
      const { data } = await api.post("/messages", {
        conversationId: conversation._id,
        text, fileUrl, fileType, fileName,
      });
      setMessages((prev) => [...prev, data.message]);
      emitTypingStop(conversation._id);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send message");
    } finally { setSending(false); }
  };

  // Group messages by date for separators
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = dayjs(msg.createdAt).format("YYYY-MM-DD");
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const dateLabel = (dateStr) => {
    const d = dayjs(dateStr);
    if (d.isToday()) return "Today";
    if (d.isYesterday()) return "Yesterday";
    return d.format("MMMM D, YYYY");
  };

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700 bg-surface-800/50 backdrop-blur-sm shrink-0">
        <button onClick={onBack} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors -ml-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={isGroup ? () => setShowGroupInfo(true) : undefined}
          className={`flex items-center gap-3 flex-1 min-w-0 ${isGroup ? "hover:opacity-80 transition-opacity cursor-pointer" : ""}`}
        >
          <Avatar src={avatar} name={name || "?"} size="md" online={isOnline} />
          <div className="min-w-0 text-left">
            <p className="font-semibold text-white text-sm truncate">{name}</p>
            <p className="text-xs text-slate-400">
              {isGroup
                ? `${conversation.members?.length || 0} members`
                : isOnline
                ? "Online"
                : other?.lastSeen
                ? `Last seen ${dayjs(other.lastSeen).fromNow()}`
                : "Offline"}
            </p>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {loading ? (
          <div className="flex justify-center items-center h-full"><Spinner /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-surface-700 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium">No messages yet</p>
            <p className="text-slate-500 text-sm mt-1">Say hello! 👋</p>
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            )}
            {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-surface-700" />
                <span className="text-xs text-slate-500 bg-surface-800 px-3 py-1 rounded-full border border-surface-700">
                  {dateLabel(date)}
                </span>
                <div className="flex-1 h-px bg-surface-700" />
              </div>
              {msgs.map((msg, i) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isMine={msg.sender._id === user._id || msg.sender === user._id}
                  showAvatar={isGroup}
                  prevSenderId={i > 0 ? msgs[i - 1].sender._id || msgs[i - 1].sender : null}
                />
              ))}
            </div>
          ))}
        </>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-end gap-2 mt-2"
            >
              <div className="bg-surface-700 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        conversationId={conversation._id}
        onSend={sendMessage}
        sending={sending}
        onTypingStart={() => emitTypingStart(conversation._id)}
        onTypingStop={() => emitTypingStop(conversation._id)}
      />

      {/* Group Info Modal */}
      <AnimatePresence>
        {showGroupInfo && (
          <GroupInfoModal
            conversation={conversation}
            onClose={() => setShowGroupInfo(false)}
            onUpdate={onConversationUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
