import { motion } from "framer-motion";

export default function WelcomeScreen({ user }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full bg-surface-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <div className="w-24 h-24 bg-brand-600/10 border border-brand-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-bold text-white mb-3">
          Welcome, {user?.name?.split(" ")[0]}!
        </h2>
        <p className="text-slate-400 text-base max-w-sm">
          Select a conversation from the sidebar or start a new chat to begin messaging.
        </p>

        <div className="flex items-center justify-center gap-6 mt-10">
          {[
            { icon: "💬", label: "Real-time chat" },
            { icon: "🔒", label: "End-to-end secure" },
            { icon: "📎", label: "File sharing" },
            { icon: "👥", label: "Group chats" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 bg-surface-700 rounded-xl flex items-center justify-center text-xl">
                {icon}
              </div>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
