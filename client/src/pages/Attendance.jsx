import { useCallback, useEffect, useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import AttendanceCalendar from "../components/attendance/AttendanceCalendar";
import CorrectionRequestSection from "../components/attendance/CorrectionRequestSection";
import AdminAttendanceTable from "../components/attendance/AdminAttendanceTable";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { Download } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { downloadBlob } from "../utils/download";

const Attendance = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role_type === "ADMIN";
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/attendance?page=${page}&pageSize=15`);
      setHistory(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
      if (res.data?.employee?.isDeleted) setIsDeleted(true);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await api.get("/reports/attendance", { responseType: "blob" })
      downloadBlob(res.data, `attendance_${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success("Attendance exported")
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || "Export failed")
    } finally {
      setExporting(false)
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = history.find((r) => {
    const d = new Date(r.date);
    return !isNaN(d.getTime()) && d.toDateString() === today.toDateString();
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle="Track your work hours and daily check-ins"
        action={
          isAdmin && (
            <Button variant="secondary" loading={exporting} onClick={exportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          )
        }
      />

      {!isAdmin ? (
        <>
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
          <AttendanceCalendar />

          <div className="flex items-center justify-between mb-4 mt-6">
            <h2 className="text-base font-semibold text-ink-900">Attendance History</h2>
            {!loading && <Badge tone="ink">{history.length} records</Badge>}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-600 px-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-6">
            <CorrectionRequestSection onRequestSent={fetchData} />
          </div>
        </>
      ) : (
        <AdminAttendanceTable />
      )}
    </div>
  );
};

export default Attendance;