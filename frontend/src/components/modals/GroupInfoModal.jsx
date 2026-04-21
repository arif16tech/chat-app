import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../shared/Avatar.jsx";
import api from "../../api/axios.js";

export default function GroupInfoModal({ conversation, onClose, onUpdate }) {
  const { user } = useAuth();
  const group = conversation.group;
  const isAdmin = group?.admin?._id === user._id || group?.admin === user._id;
  const [leaving, setLeaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const handleLeave = async () => {
    if (!window.confirm("Leave this group?")) return;
    setLeaving(true);
    try {
      await api.post(`/groups/${group._id}/leave`);
      toast.success("Left the group");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to leave group");
    } finally { setLeaving(false); }
  };

  const handleRemove = async (memberId) => {
    setRemoving(memberId);
    try {
      await api.post(`/groups/${group._id}/remove-member`, { userId: memberId });
      toast.success("Member removed");
      // Refresh conversation
      const { data } = await api.get("/conversations");
      const updated = data.conversations.find((c) => c._id === conversation._id);
      if (updated) onUpdate(updated);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    } finally { setRemoving(null); }
  };

  const members = conversation.members || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-600 shrink-0">
          <h2 className="font-display font-semibold text-white">Group Info</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Group avatar + name */}
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <Avatar src={group?.avatar} name={group?.name || "G"} size="2xl" />
            <h3 className="font-display text-xl font-bold text-white mt-3">{group?.name}</h3>
            {group?.description && <p className="text-slate-400 text-sm mt-1 text-center">{group.description}</p>}
            <p className="text-xs text-slate-500 mt-2">{members.length} members</p>
          </div>

          {/* Members */}
          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Members</p>
            <div className="space-y-1">
              {members.map((m) => {
                const memberId = m._id;
                const adminId = group?.admin?._id || group?.admin;
                const isMemberAdmin = memberId === adminId;
                const isMe = memberId === user._id;
                return (
                  <div key={memberId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-700 transition-colors">
                    <Avatar src={m.profilePic} name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {m.name} {isMe && <span className="text-slate-500 text-xs">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-400">@{m.username}</p>
                    </div>
                    {isMemberAdmin && (
                      <span className="text-[10px] bg-brand-600/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                    {isAdmin && !isMe && !isMemberAdmin && (
                      <button
                        onClick={() => handleRemove(memberId)}
                        disabled={removing === memberId}
                        className="text-red-400 hover:text-red-300 text-xs transition-colors disabled:opacity-50"
                      >
                        {removing === memberId ? "..." : "Remove"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-surface-600 shrink-0">
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-2.5 rounded-xl text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-all font-medium text-sm disabled:opacity-50"
          >
            {leaving ? "Leaving..." : "Leave Group"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
