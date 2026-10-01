import { useCallback, useEffect, useState } from "react";
import { ScrollText, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import api from "../api/axios";

const ENTITY_COLORS = {
  EMPLOYEE: "primary",
  LEAVE: "warning",
  PAYSLIP: "success",
  ATTENDANCE: "ink",
  ANNOUNCEMENT: "primary",
  ATTENDANCE_CORRECTION: "warning",
};

const ACTION_COLORS = {
  CREATE: "success",
  UPDATE: "primary",
  DELETE: "danger",
  LEAVE_STATUS: "warning",
  ATTENDANCE_CORRECT: "primary",
  ATTENDANCE_CORRECTION_REVIEW: "warning",
  ANNOUNCEMENT_CREATE: "success",
  ANNOUNCEMENT_UPDATE: "primary",
  ANNOUNCEMENT_DELETE: "danger",
  PAYSLIP_CREATE: "success",
  PAYSLIP_BATCH: "primary",
};

const actionTone = (action) => ACTION_COLORS[action] || "ink";

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/audit?page=${page}&pageSize=${pageSize}`);
      setLogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
      setError(err?.response?.data?.error || err?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit Trail"
        subtitle={`${total} recorded events across the system`}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse bg-ink-50 h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Could not load audit trail"
            description={error}
            action={
              <button onClick={fetchLogs} className="btn-secondary mt-2">
                Try again
              </button>
            }
          />
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ScrollText}
            title="No audit records yet"
            description="Actions like creating employees or approving leaves will appear here."
          />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 bg-ink-50/60 border-b border-ink-100">
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id || log._id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{log.actor ? log.actor.name || log.actor.email : "System"}</p>
                      {log.actor?.email && <p className="text-xs text-ink-400">{log.actor.email}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={actionTone(log.action)}>{log.action}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={ENTITY_COLORS[log.entity] || "ink"}>{log.entity}</Badge>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{formatTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-ink-100">
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
        </Card>
      )}
    </div>
  );
};

export default AuditLog;