import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "../../api/axios.js";

export default function MessageInput({ conversationId, onSend, sending, onTypingStart, onTypingStop }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(typingTimer.current);
  }, []);

  const handleTyping = (val) => {
    setText(val);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop();
    }, 1500);
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50MB)");
      return;
    }
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview({ type: "image", url: ev.target.result, name: selected.name });
      reader.readAsDataURL(selected);
    } else if (selected.type.startsWith("video/")) {
      setPreview({ type: "video", url: URL.createObjectURL(selected), name: selected.name });
    } else {
      setPreview({ type: "file", name: selected.name });
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !file) return;
    if (sending || uploading) return;

    let fileData = {};
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/messages/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileData = { fileUrl: data.fileUrl, fileType: data.fileType, fileName: data.fileName };
      } catch {
        toast.error("File upload failed");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    onTypingStop();
    isTypingRef.current = false;
    clearTimeout(typingTimer.current);

    await onSend({ text: text.trim(), ...fileData });
    setText("");
    clearFile();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (text.trim() || file) && !sending && !uploading;

  return (
    <div className="border-t border-surface-700 bg-surface-800/50 backdrop-blur-sm px-4 py-3 shrink-0">
      {/* File Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="bg-surface-700 rounded-xl p-3 flex items-start gap-3">
              {preview.type === "image" && (
                <img src={preview.url} alt="preview" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              {preview.type === "video" && (
                <video src={preview.url} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              {preview.type === "file" && (
                <div className="w-12 h-12 bg-surface-600 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 font-medium truncate">{preview.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{preview.type}</p>
              </div>
              <button onClick={clearFile} className="text-slate-500 hover:text-white transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {/* File Button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 p-2.5 text-slate-400 hover:text-white hover:bg-surface-700 rounded-xl transition-all"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="input-field resize-none py-2.5 pr-2 text-sm max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />
        </div>

        {/* Send Button */}
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          whileTap={{ scale: 0.9 }}
          className={`shrink-0 p-2.5 rounded-xl transition-all ${
            canSend
              ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30"
              : "bg-surface-700 text-slate-600 cursor-not-allowed"
          }`}
        >
          {sending || uploading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </motion.button>
      </div>
    </div>
  );
}
