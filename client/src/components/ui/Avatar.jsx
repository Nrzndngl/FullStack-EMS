const Avatar = ({ name = "", className = "w-9 h-9 text-xs", tone = "primary" }) => {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bg =
    tone === "primary"
      ? "bg-primary-100 text-primary-700"
      : "bg-ink-100 text-ink-600";

  return (
    <span
      className={`${bg} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

export default Avatar;
