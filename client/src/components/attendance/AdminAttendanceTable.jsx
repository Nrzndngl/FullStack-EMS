import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Search } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import { formatNepalDate, formatNepalTime } from "../../utils/format";

const statusTone = (status) =>
  status === "PRESENT" ? "success" : status === "LATE" ? "warning" : "danger";

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminAttendanceTable = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set("employeeId", search);
      const res = await api.get(`/attendance/all?${params.toString()}`);
      setRecords(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    try {
      const data = {
        status: form.status.value,
        checkIn: form.checkIn.value ? new Date(form.checkIn.value).toISOString() : undefined,
        checkOut: form.checkOut.value ? new Date(form.checkOut.value).toISOString() : undefined,
        dayType: form.dayType.value || undefined,
      };
      await api.put(`/attendance/${editing.id}/correct`, data);
      toast.success("Attendance record updated");
      setEditing(null);
      fetchRecords();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter by employee ID..."
            className="input pl-10"
          />
        </div>
        <Badge tone="ink">{total} records</Badge>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-400 text-sm">Loading...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState title="No attendance records" description="Records will appear here." />
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const name = r.employee
                    ? `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim()
                    : "Unknown";
                  return (
                    <tr key={r.id || r._id}>
                      <td className="font-medium text-ink-900">{name}</td>
                      <td className="text-ink-600">{formatNepalDate(r.date)}</td>
                      <td className="text-ink-600">{r.checkIn ? formatNepalTime(r.checkIn) : "—"}</td>
                      <td className="text-ink-600">{r.checkOut ? formatNepalTime(r.checkOut) : "—"}</td>
                      <td>
                        <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => setEditing(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors ring-1 ring-primary-600/10"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Correct
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
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

      {/* Correct attendance modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Correct Attendance"
        description="Manually correct a recorded attendance entry"
        maxWidth="max-w-md"
      >
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <p className="text-sm text-ink-500 mb-1">Date</p>
              <p className="font-medium text-ink-900">{formatNepalDate(editing.date)}</p>
            </div>
            <div>
              <label className="field-label">Check In</label>
              <input type="datetime-local" name="checkIn" defaultValue={toDateTimeLocal(editing.checkIn)} className="input" />
            </div>
            <div>
              <label className="field-label">Check Out</label>
              <input type="datetime-local" name="checkOut" defaultValue={toDateTimeLocal(editing.checkOut)} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Status</label>
                <select name="status" defaultValue={editing.status} className="select">
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
              <div>
                <label className="field-label">Day Type</label>
                <select name="dayType" defaultValue={editing.dayType || ""} className="select">
                  <option value="">—</option>
                  <option value="Full Day">Full Day</option>
                  <option value="Three Quarter Day">Three Quarter Day</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Short Day">Short Day</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save Correction
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminAttendanceTable;