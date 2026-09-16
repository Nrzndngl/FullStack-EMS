// Simple dependency-free horizontal bar chart
export const HBarChart = ({ items = [], colorBar = "bg-primary-500" }) => {
  const max = Math.max(1, ...items.map((i) => i.value ?? 0));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs text-ink-600 truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-ink-50 rounded-md overflow-hidden">
            <div
              className={`h-full ${colorBar} rounded-md transition-all duration-500`}
              style={{ width: `${Math.max(2, ((item.value ?? 0) / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-ink-800">
            {item.value ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
};

// Simple dependency-free vertical bar chart
export const VBarChart = ({ series = [], colorBar = "bg-primary-500", height = 180 }) => {
  const max = Math.max(1, ...series.map((s) => s.value ?? 0));

  return (
    <div className="flex items-end gap-2" style={{ height: `${height}px` }}>
      {series.map((s, idx) => {
        const v = s.value ?? 0;
        const h = max > 0 ? Math.max(4, (v / max) * 100) : 0;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
            <span className="text-xs font-medium text-ink-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {v}
            </span>
            <div
              className={`w-full max-w-[32px] rounded-t-md ${colorBar} group-hover:opacity-80 transition-opacity`}
              style={{ height: `${h}%` }}
              title={`${s.label}: ${v}`}
            />
            <span className="mt-1 text-[10px] text-ink-400 truncate w-full text-center">
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};