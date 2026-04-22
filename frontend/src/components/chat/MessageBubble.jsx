import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "../../utils/dayjs.js";
import Avatar from "../shared/Avatar.jsx";

export default function MessageBubble({ message, isMine, showAvatar, prevSenderId }) {
  const [showPreview, setShowPreview] = useState(false);
  const senderId = message.sender?._id || message.sender;
  const isFirstInGroup = senderId !== prevSenderId;
  const time = dayjs(message.createdAt).format("HH:mm");

  const StatusIcon = () => {
    if (!isMine) return null;
    if (message.status === "seen") return (
      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L7 17l-5-5"/>
        <path d="M22 10l-7.5 7.5L13 16"/>
      </svg>
    );
    if (message.status === "delivered") return (
      <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L7 17l-5-5"/>
        <path d="M22 10l-7.5 7.5L13 16"/>
      </svg>
    );
    return (
      <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    );
  };

  const renderContent = () => {
    if (message.fileType === "image" && message.fileUrl) {
      return (
        <div>
          <img
            src={message.fileUrl}
            alt="attachment"
            onClick={() => setShowPreview(true)}
            className="max-w-[280px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
          />
          {message.text && <p className="mt-1.5 text-sm">{message.text}</p>}
        </div>
      );
    }
    if (message.fileType === "video" && message.fileUrl) {
      return (
        <div>
          <div className="relative max-w-[280px] rounded-xl overflow-hidden cursor-pointer group" onClick={() => setShowPreview(true)}>
            <video src={message.fileUrl} className="w-full h-auto pointer-events-none" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
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
    return <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">{message.text}</p>;
  };

  return (
    <>
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

    {/* Media Preview Modal */}
    <AnimatePresence>
      {showPreview && (message.fileType === "image" || message.fileType === "video") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-8"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 z-50 text-white/70 hover:text-white p-2 bg-black/20 rounded-full backdrop-blur-sm transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {message.fileType === "image" ? (
            <img
              src={message.fileUrl}
              alt="preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <video
              src={message.fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
}
