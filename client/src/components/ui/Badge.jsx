const tones = {
  ink: "badge-ink",
  primary: "badge-primary",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
};

const Badge = ({ tone = "ink", className = "", children }) => {
  return <span className={`${tones[tone]} ${className}`}>{children}</span>;
};

export default Badge;
