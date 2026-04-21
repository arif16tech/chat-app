export default function Spinner({ fullscreen = false, size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

  const spinner = (
    <div
      className={`${sizes[size]} border-2 border-surface-500 border-t-brand-500 rounded-full animate-spin`}
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-surface-900 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  return spinner;
}
