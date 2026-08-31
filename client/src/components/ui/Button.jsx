import { Loader2 } from "lucide-react";

const Button = ({
  variant = "primary",
  type = "button",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) => {
  const classes = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${classes} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
