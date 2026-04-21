import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import dayjs from "../utils/dayjs.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import api from "../api/axios.js";

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile"); // profile | password | blocked
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [blockedUsers, setBlockedUsers] = useState(null);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const picRef = useRef(null);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty");
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", { name: name.trim() });
      updateUser({ name: data.user.name });
      toast.success("Profile updated!");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to update"); }
    finally { setSaving(false); }
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append("profilePic", file);
      const { data } = await api.put("/users/profile-pic", fd, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser({ profilePic: data.profilePic });
      toast.success("Profile picture updated!");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingPic(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirm } = passwords;
    if (!currentPassword || !newPassword || !confirm) return toast.error("All fields required");
    if (newPassword !== confirm) return toast.error("Passwords don't match");
    if (newPassword.length < 6) return toast.error("Password min 6 characters");
    setSaving(true);
    try {
      await api.put("/users/password", { currentPassword, newPassword });
      toast.success("Password changed!");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  };

  const loadBlocked = async () => {
    if (blockedUsers !== null) return;
    setLoadingBlocked(true);
    try {
      const { data } = await api.get("/users/blocked");
      setBlockedUsers(data.blockedUsers);
    } catch { toast.error("Failed to load"); }
    finally { setLoadingBlocked(false); }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post(`/users/unblock/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User unblocked");
    } catch { toast.error("Failed to unblock"); }
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "blocked", label: "Blocked Users" },
  ];

  return (
    <div className="min-h-screen bg-surface-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Back button */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group">
          <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to chats
        </button>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar src={user?.profilePic} name={user?.name || "?"} size="2xl" online={true} />
              <button
                onClick={() => picRef.current?.click()}
                disabled={uploadingPic}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 hover:bg-brand-500 rounded-full flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
              >
                {uploadingPic
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                }
              </button>
              <input ref={picRef} type="file" className="hidden" accept="image/*" onChange={handlePicChange} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-slate-400">@{user?.username}</p>
              <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
              <p className="text-xs text-slate-600 mt-1">Member since {dayjs(user?.createdAt).format("MMMM YYYY")}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-800 rounded-xl p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === "blocked") loadBlocked(); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          {tab === "profile" && (
            <form onSubmit={handleSaveName} className="space-y-4">
              <h2 className="font-display font-semibold text-white mb-4">Edit Profile</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name</label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                <input type="text" className="input-field opacity-60 cursor-not-allowed" value={user?.username} disabled />
                <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input type="text" className="input-field opacity-60 cursor-not-allowed" value={user?.email} disabled />
              </div>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {tab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h2 className="font-display font-semibold text-white mb-4">Change Password</h2>
              {["currentPassword", "newPassword", "confirm"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {field === "currentPassword" ? "Current Password" : field === "newPassword" ? "New Password" : "Confirm New Password"}
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={passwords[field]}
                    onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                  />
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {tab === "blocked" && (
            <div>
              <h2 className="font-display font-semibold text-white mb-4">Blocked Users</h2>
              {loadingBlocked ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-surface-500 border-t-brand-500 rounded-full animate-spin" /></div>
              ) : blockedUsers?.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No blocked users</p>
              ) : (
                <div className="space-y-2">
                  {blockedUsers?.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-3 bg-surface-700 rounded-xl">
                      <Avatar src={u.profilePic} name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{u.name}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                      <button onClick={() => handleUnblock(u._id)} className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Danger zone */}
        <div className="mt-6 glass-card p-4">
          <button onClick={() => { logout(); navigate("/login"); }} className="w-full text-red-400 hover:text-red-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
