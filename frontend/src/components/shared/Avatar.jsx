export default function Avatar({ src, name = "?", size = "md", online = false, className = "" }) {
  const sizes = {
    xs: "w-7 h-7 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-20 h-20 text-2xl",
  };
  const dotSizes = {
    xs: "w-2 h-2 border",
    sm: "w-2 h-2 border",
    md: "w-2.5 h-2.5 border-2",
    lg: "w-3 h-3 border-2",
    xl: "w-3.5 h-3.5 border-2",
    "2xl": "w-4 h-4 border-2",
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Generate deterministic color from name
  const colors = [
    "bg-violet-600", "bg-indigo-600", "bg-blue-600", "bg-cyan-600",
    "bg-teal-600", "bg-emerald-600", "bg-pink-600", "bg-rose-600",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-surface-600`}
        />
      ) : (
        <div
          className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-surface-600`}
        >
          {initials}
        </div>
      )}
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-emerald-400 rounded-full border-surface-800`}
        />
      )}
    </div>
  );
}
