import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import api from "../../api/axios";
import { formatDisplayDate } from "../../utils/format";

const TZ = "Asia/Kathmandu";

const pad = (n) => String(n).padStart(2, "0");

const nepalYMD = (d = new Date()) => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
};

const monthDays = (year, month /* 1-based */) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const cellTone = (record) => {
  if (record.status === "LATE") return "bg-amber-100 text-amber-900";
  if (record.status === "ABSENT") return "bg-rose-100 text-rose-900";
  return "bg-emerald-100 text-emerald-900";
};

const LEGEND = [
  { color: "bg-emerald-400", label: "Present" },
  { color: "bg-amber-400", label: "Late" },
  { color: "bg-rose-400", label: "Absent" },
  { color: "bg-ink-200", label: "Holiday" },
  { color: "bg-ink-50 ring-1 ring-ink-200", label: "No record" },
];

const AttendanceCalendar = () => {
  const todayKey = nepalYMD();
  const [view, setView] = useState(() => {
    const [y, m] = todayKey.split("-").map(Number);
    return { year: y, month: m };
  });
  const [records, setRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const { year, month } = view;
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(monthDays(year, month))}`;

  const fetchMonth = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ from, to, pageSize: "200", page: "1" });
      const [att, h1, h2] = await Promise.all([
        api.get(`/attendance?${params.toString()}`),
        api.get(`/holidays?year=${year}`),
        api.get(`/holidays?year=${year + 1}`),
      ]);
      setRecords(att.data?.data || []);
      setHolidays([...(h1.data?.data || []), ...(h2.data?.data || [])]);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [from, to, year]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  const recordByKey = {};
  records.forEach((r) => {
    recordByKey[nepalYMD(new Date(r.date))] = r;
  });
  const holidayByKey = {};
  holidays.forEach((h) => {
    holidayByKey[h.date] = h;
  });

  const shiftMonth = (delta) => {
    setView((v) => {
      const d = new Date(Date.UTC(v.year, v.month - 1 + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    });
  };

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = monthDays(year, month);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const key = `${year}-${pad(month)}-${pad(d)}`;
    cells.push(key);
  }

  const isCurrentMonth = `${year}-${pad(month)}` === todayKey.slice(0, 7);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-ink-900">Month overview</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-ink-700 min-w-[110px] text-center">
            {new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-ink-400">Loading calendar...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs font-medium text-ink-400 py-1">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((key, i) => {
              if (!key) return <div key={`blank-${i}`} />;
              const dayNum = Number(key.slice(-2));
              const record = recordByKey[key];
              const holiday = holidayByKey[key];
              const isToday = key === todayKey;
              const isFuture = key > todayKey;
              const isWeekend = new Date(Date.UTC(year, month - 1, dayNum)).getUTCDay() === 0
                || new Date(Date.UTC(year, month - 1, dayNum)).getUTCDay() === 6;

              const tone = record
                ? cellTone(record)
                : holiday
                ? "bg-ink-200 text-ink-700"
                : "bg-ink-50 ring-1 ring-ink-200/70 text-ink-500";

              return (
                <div
                  key={key}
                  title={
                    record
                      ? `${formatDisplayDate(new Date(key + "T00:00:00"))} — ${record.status}`
                      : holiday
                      ? `${holiday.name} (holiday)`
                      : formatDisplayDate(new Date(key + "T00:00:00"))
                  }
                  className={`relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${tone} ${
                    isFuture ? "opacity-40" : ""} ${isToday ? "ring-2 ring-primary-500" : ""}`}
                >
                  {dayNum}
                  {holiday && !record && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary-500" />
                  )}
                  {isWeekend && !record && !holiday && (
                    <span className="absolute bottom-1 text-[9px] leading-none text-ink-300">wk</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5">
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-ink-500">
                <span className={`w-3 h-3 rounded ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceCalendar;