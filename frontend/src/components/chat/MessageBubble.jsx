import dayjs from "../../utils/dayjs.js";
import Avatar from "../shared/Avatar.jsx";

export default function MessageBubble({ message, isMine, showAvatar, prevSenderId }) {
  const senderId = message.sender?._id || message.sender;
  const isFirstInGroup = senderId !== prevSenderId;
  const time = dayjs(message.createdAt).format("HH:mm");

  const StatusIcon = () => {
    if (!isMine) return null;
    if (message.status === "seen") return (
      <svg className="w-3.5 h-3.5 text-brand-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7l-8 8-4-4-1.5 1.5 5.5 5.5 9.5-9.5z" />
        <path d="M22 7l-8 8-1.5-1.5 1.5-1.5 6.5 6.5 9.5-9.5z" opacity="0.5" />
      </svg>
    );
    if (message.status === "delivered") return (
      <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 7l-8 8-4-4-1.5 1.5 5.5 5.5 9.5-9.5z" />
      </svg>
    );
    return (
      <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  };

  const renderContent = () => {
    if (message.fileType === "image" && message.fileUrl) {
      return (
        <div>
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={message.fileUrl}
              alt="attachment"
              className="max-w-[280px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
            />
          </a>
          {message.text && <p className="mt-1.5 text-sm">{message.text}</p>}
        </div>
      );
    }
    if (message.fileType === "video" && message.fileUrl) {
      return (
        <div>
          <video src={message.fileUrl} controls className="max-w-[280px] rounded-xl" />
          {message.text && <p className="mt-1.5 text-sm">{message.text}</p>}
        </div>
      );
    }
    if (message.fileType === "file" && message.fileUrl) {
      return (
        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-medium truncate max-w-[180px]">{message.fileName || "File"}</span>
        </a>
      );
    }
    return <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>;
  };

  return (
    <div className={`flex items-end gap-2 mb-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar for group chats */}
      {showAvatar && !isMine && (
        <div className="w-7 shrink-0">
          {isFirstInGroup && (
            <Avatar src={message.sender?.profilePic} name={message.sender?.name || "?"} size="xs" />
          )}
        </div>
      )}

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[70%]`}>
        {/* Sender name for group */}
        {showAvatar && !isMine && isFirstInGroup && (
          <p className="text-xs text-brand-400 font-medium mb-1 ml-1">
            {message.sender?.name}
          </p>
        )}

        <div className={isMine ? "message-bubble-sent" : "message-bubble-received"}>
          {renderContent()}
        </div>

        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-slate-500">{time}</span>
          <StatusIcon />
        </div>
      </div>
    </div>
  );
}
