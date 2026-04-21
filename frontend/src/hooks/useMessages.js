import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import api from "../api/axios.js";

export function useMessages(conversationId, socket, userId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const initialized = useRef(false);

  const fetchMessages = useCallback(async (pg = 1) => {
    if (!conversationId) return;
    if (pg === 1) setLoading(true);
    try {
      const { data } = await api.get(`/messages/${conversationId}?page=${pg}&limit=50`);
      if (pg === 1) {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...data.messages, ...prev]);
      }
      setHasMore(pg < data.pages);
      setPage(pg);
      // Mark seen
      await api.put(`/messages/seen/${conversationId}`);
    } catch {
      if (pg === 1) toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    initialized.current = false;
    setMessages([]);
    setPage(1);
    setHasMore(false);
    fetchMessages(1);
    initialized.current = true;
  }, [fetchMessages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    const onNew = (msg) => {
      if (msg.conversation !== conversationId) return;
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
      api.put(`/messages/seen/${conversationId}`).catch(() => {});
    };

    const onSeen = ({ conversationId: cid }) => {
      if (cid !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.sender?._id === userId || m.sender === userId
            ? { ...m, status: "seen" }
            : m
        )
      );
    };

    const onDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, status: "delivered" } : m)
      );
    };

    socket.on("new_message", onNew);
    socket.on("messages_seen", onSeen);
    socket.on("message_delivered", onDelivered);

    return () => {
      socket.off("new_message", onNew);
      socket.off("messages_seen", onSeen);
      socket.off("message_delivered", onDelivered);
    };
  }, [socket, conversationId, userId]);

  const addMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const loadMore = () => {
    if (hasMore && !loading) fetchMessages(page + 1);
  };

  return { messages, loading, hasMore, loadMore, addMessage };
}
