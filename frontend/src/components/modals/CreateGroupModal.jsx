import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "../../api/axios.js";
import Avatar from "../shared/Avatar.jsx";

export default function CreateGroupModal({ onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setSearchResults(data.users.filter((u) => !selected.find((s) => s._id === u._id)));
      } catch {} finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, selected]);

  const toggleUser = (u) => {
    setSelected((prev) =>
      prev.find((s) => s._id === u._id) ? prev.filter((s) => s._id !== u._id) : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Group name is required");
    if (selected.length < 1) return toast.error("Add at least 1 member");
    setCreating(true);
    try {
      const { data } = await api.post("/groups", {
        name: name.trim(),
        description: description.trim(),
        memberIds: selected.map((u) => u._id),
      });
      toast.success(`Group "${name}" created!`);
      // Fetch the conversation
      const { data: convData } = await api.get("/conversations");
      const conv = convData.conversations.find((c) => c.group?._id === data.group._id || c._id === data.conversationId);
      onCreated(conv || { _id: data.conversationId, isGroup: true, group: data.group, members: [] });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create group");
    } finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-600">
          <h2 className="font-display font-semibold text-white">Create Group</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Group info */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Group Name *</label>
            <input type="text" className="input-field" placeholder="e.g. Team Alpha" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <input type="text" className="input-field" placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
          </div>

          {/* Member search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Add Members</label>
            <input type="text" className="input-field" placeholder="Search by name or username..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {/* Selected members */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <button key={u._id} onClick={() => toggleUser(u)} className="flex items-center gap-1.5 bg-brand-600/20 text-brand-300 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-brand-600/30 transition-colors border border-brand-500/30">
                  <Avatar src={u.profilePic} name={u.name} size="xs" />
                  {u.name}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="bg-surface-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <button key={u._id} onClick={() => toggleUser(u)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-600 transition-colors text-left">
                  <Avatar src={u.profilePic} name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={creating || !name.trim() || selected.length < 1} className="btn-primary flex-1">
            {creating ? "Creating..." : `Create (${selected.length + 1} members)`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
