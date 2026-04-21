import dayjs from "../../utils/dayjs.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import Avatar from "../shared/Avatar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

dayjs.extend(relativeTime);

export default function ConversationItem({ conversation, currentUser, isActive, onlineUsers, onClick }) {
  const { user } = useAuth();
  const isGroup = conversation.isGroup;
  const other = !isGroup && conversation.members?.find((m) => m._id !== currentUser._id);

  const name = isGroup ? conversation.group?.name : other?.name;
  const avatar = isGroup ? conversation.group?.avatar : other?.profilePic;
  const avatarName = name || "?";
  const isOnline = !isGroup && onlineUsers.includes(other?._id);

  const lastMsg = conversation.lastMessage;
  let lastText = "No messages yet";
  if (lastMsg) {
    if (lastMsg.text) lastText = lastMsg.text;
    else if (lastMsg.fileType === "image") lastText = "📷 Photo";
    else if (lastMsg.fileType === "video") lastText = "🎬 Video";
    else if (lastMsg.fileType === "file") lastText = "📎 File";
    if (lastMsg.sender?._id === currentUser._id) lastText = `You: ${lastText}`;
  }

  const time = lastMsg?.createdAt ? dayjs(lastMsg.createdAt).format("HH:mm") : "";
  const unread = conversation.unreadCount || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-surface-750 text-left ${
        isActive ? "bg-brand-600/10 border-r-2 border-brand-500" : ""
      }`}
    >
      <Avatar src={avatar} name={avatarName} size="md" online={isOnline} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-slate-200"}`}>
            {name}
          </span>
          <span className="text-xs text-slate-500 shrink-0 ml-2">{time}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-xs truncate ${unread > 0 ? "text-slate-300 font-medium" : "text-slate-500"}`}>
            {lastText}
          </p>
          {unread > 0 && (
            <span className="ml-2 shrink-0 min-w-[18px] h-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
