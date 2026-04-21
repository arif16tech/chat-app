import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import Avatar from "../shared/Avatar.jsx";
import ConversationItem from "./ConversationItem.jsx";
import UserSearchModal from "../modals/UserSearchModal.jsx";
import CreateGroupModal from "../modals/CreateGroupModal.jsx";
import api from "../../api/axios.js";

export default function Sidebar({ conversations, loading, activeId, onSelect, onNewConversation, onConversationsChange }) {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const filtered = conversations.filter((c) => {
    if (!searchQ.trim()) return true;
    if (c.isGroup) return c.group?.name?.toLowerCase().includes(searchQ.toLowerCase());
    const other = c.members.find((m) => m._id !== user._id);
    return (
      other?.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
      other?.username?.toLowerCase().includes(searchQ.toLowerCase())
    );
  });

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full bg-surface-900">
      {/* Header */}
      <div className="p-4 border-b border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")} className="hover:opacity-80 transition-opacity">
              <Avatar
                src={user?.profilePic}
                name={user?.name}
                size="md"
                online={true}
              />
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-surface-700 rounded-lg transition-all"
              title="New Group"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-surface-700 rounded-lg transition-all"
              title="New Chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-400 hover:text-white hover:bg-surface-700 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-surface-700 border border-surface-500 rounded-xl shadow-xl z-50 overflow-hidden"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button onClick={() => { navigate("/profile"); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-surface-600 hover:text-white flex items-center gap-2 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Profile
                    </button>
                    <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-surface-600 flex items-center gap-2 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-6 h-6 border-2 border-surface-500 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <div className="w-12 h-12 bg-surface-700 rounded-2xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No conversations yet</p>
            <p className="text-slate-500 text-xs mt-1">Start a new chat by pressing +</p>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUser={user}
                isActive={conv._id === activeId}
                onlineUsers={onlineUsers}
                onClick={() => onSelect(conv)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUserSearch && (
          <UserSearchModal
            onClose={() => setShowUserSearch(false)}
            onSelect={(conv) => { onNewConversation(conv); setShowUserSearch(false); }}
          />
        )}
        {showCreateGroup && (
          <CreateGroupModal
            onClose={() => setShowCreateGroup(false)}
            onCreated={(conv) => { onNewConversation(conv); setShowCreateGroup(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
