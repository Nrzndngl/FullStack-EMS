import { useCallback, useEffect, useState } from "react";
import { CalendarX2 } from "lucide-react";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import api from "../api/axios";
import toast from "react-hot-toast";

const Attendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/attendance");
      setHistory(res.data?.data || []);
      if (res.data?.employee?.isDeleted) setIsDeleted(true);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = history.find((r) => {
    const d = new Date(r.date || r.Date);
    return !isNaN(d.getTime()) && d.toDateString() === today.toDateString();
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendance" subtitle="Track your work hours and daily check-ins" />

      {isDeleted ? (
        <div className="mb-7 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700">
          <CalendarX2 className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            You can no longer clock in or out because your employee record has been deactivated.
          </p>
        </div>
      ) : (
        <CheckInButton todayRecord={todayRecord} onAction={fetchData} />
      )}

      <AttendanceStats history={history} />

      <div className="flex items-center justify-between mb-4 mt-10">
        <h2 className="text-base font-semibold text-ink-900">Attendance History</h2>
        <Badge tone="ink">{history.length} records</Badge>
      </div>

      {!loading && history.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CalendarX2}
            title="No attendance records"
            description="Clock in to start tracking your attendance."
          />
        </div>
      ) : (
        <AttendanceHistory history={history} />
      )}
    </div>
  );
};

export default Attendance;
