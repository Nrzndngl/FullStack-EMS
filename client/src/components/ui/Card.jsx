const Card = ({ className = "", children, ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = ({ title, description, action, className = "" }) => (
  <div className={`flex items-start justify-between gap-4 px-5 py-4 border-b border-ink-100 ${className}`}>
    <div>
      {title && <h3 className="text-sm font-semibold text-ink-900">{title}</h3>}
      {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);

Card.Body = ({ className = "", children }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

export default Card;
