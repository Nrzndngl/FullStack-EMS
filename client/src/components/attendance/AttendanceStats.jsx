import { CalendarCheck, AlertCircle, Clock } from "lucide-react";
import StatCard from "../ui/StatCard";

const AttendanceStats = ({ history }) => {
  const totalPresent = history.filter((h) => h.status === "PRESENT" || h.status === "LATE").length;
  const totalLate = history.filter((h) => h.status === "LATE").length;

  const hours = history
    .map((h) => Number(h.workingHours))
    .filter((n) => !isNaN(n) && n > 0);
  const avgHours =
    hours.length > 0
      ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1)
      : "—";

  const stats = [
    { icon: CalendarCheck, value: totalPresent, label: "Days Present", hint: "Present or late", tone: "primary" },
    { icon: AlertCircle, value: totalLate, label: "Late Arrivals", hint: "This period", tone: "warning" },
    { icon: Clock, value: `${avgHours} hrs`, label: "Avg. Work Hours", hint: "Per recorded day", tone: "ink" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-4">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
};

export default AttendanceStats;
