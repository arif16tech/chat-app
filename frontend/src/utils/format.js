import dayjs from "./dayjs.js";

export const formatMessageTime = (date) => {
  return dayjs(date).format("HH:mm");
};

export const formatDateSeparator = (date) => {
  const d = dayjs(date);
  if (d.isToday()) return "Today";
  if (d.isYesterday()) return "Yesterday";
  return d.format("MMMM D, YYYY");
};

export const formatLastSeen = (date) => {
  if (!date) return "Offline";
  const d = dayjs(date);
  if (d.isToday()) return `Last seen at ${d.format("HH:mm")}`;
  if (d.isYesterday()) return `Last seen yesterday at ${d.format("HH:mm")}`;
  return `Last seen ${d.format("MMM D [at] HH:mm")}`;
};

export const formatConversationTime = (date) => {
  if (!date) return "";
  const d = dayjs(date);
  if (d.isToday()) return d.format("HH:mm");
  if (d.isYesterday()) return "Yesterday";
  return d.format("MMM D");
};

export const truncate = (str, n = 40) => {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
};

export const getFileType = (mimeType = "", filename = "") => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return "image";
  if (mimeType.startsWith("video/") || ["mp4","mov","avi","webm","mkv"].includes(ext)) return "video";
  return "file";
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
