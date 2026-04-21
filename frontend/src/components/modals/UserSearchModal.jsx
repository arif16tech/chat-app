import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "../../api/axios.js";
import Avatar from "../shared/Avatar.jsx";
import { useSocket } from "../../context/SocketContext.jsx";

export default function UserSearchModal({ onClose, onSelect }) {
  const { onlineUsers } = useSocket();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
        setUsers(data.users);
      } catch { toast.error("Search failed"); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const startChat = async (userId) => {
    setStarting(userId);
    try {
      const { data } = await api.post("/conversations", { userId });
      onSelect(data.conversation);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start chat");
    } finally { setStarting(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-md glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-surface-600">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white placeholder-slate-500"
            />
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-surface-500 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              {query.trim() ? (
                <>
                  <p className="text-slate-400 font-medium">No users found</p>
                  <p className="text-slate-500 text-sm mt-1">Try a different name or username</p>
                </>
              ) : (
                <p className="text-slate-500 text-sm">Type to search users</p>
              )}
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u._id}
                onClick={() => startChat(u._id)}
                disabled={starting === u._id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-700 transition-colors text-left disabled:opacity-60"
              >
                <Avatar src={u.profilePic} name={u.name} size="md" online={onlineUsers.includes(u._id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                </div>
                {starting === u._id ? (
                  <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin shrink-0" />
                ) : (
                  <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
