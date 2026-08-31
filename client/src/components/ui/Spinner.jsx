const Spinner = ({ className = "w-8 h-8", label = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-label={label}>
      <div className={`animate-spin rounded-full border-2 border-primary-600 border-t-transparent ${className}`} />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
