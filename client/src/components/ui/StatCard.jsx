import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, hint, tone = "ink" }) => {
  const toneMap = {
    ink: { iconBg: "bg-ink-100 text-ink-600", bar: "bg-ink-400" },
    primary: { iconBg: "bg-primary-50 text-primary-600", bar: "bg-primary-500" },
    success: { iconBg: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    warning: { iconBg: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
    danger: { iconBg: "bg-rose-50 text-rose-600", bar: "bg-rose-500" },
  }[tone];

  return (
    <div className="card p-5 relative overflow-hidden group">
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${toneMap.bar}`} />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-ink-500">{label}</p>
          <p className="text-[26px] leading-tight font-semibold text-ink-900 mt-1.5 truncate">{value}</p>
          {hint && <p className="text-xs text-ink-400 mt-1.5">{hint}</p>}
        </div>
        {Icon && (
          <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${toneMap.iconBg}`}>
            <Icon className="w-5 h-5" />
          </span>
        )}
      </div>
    </div>
  );
};

const Trend = ({ label, value, up = true }) => (
  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
    {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
    {label} {value}
  </span>
);

export { StatCard, Trend };
export default StatCard;
