import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Search, Check, X } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import { formatNepalDate, formatNepalTime } from "../../utils/format";

const statusTone = (status) =>
  status === "PRESENT" ? "success" : status === "LATE" ? "warning" : "danger";

const correctionTone = (s) =>
  s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : "warning";

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MONGO_ID = /^[a-f\d]{24}$/i;

const RecordsTab = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  // Bumped after a save to refetch the current view.
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Settle search and page reset in ONE update so a stale request for the
      // old page can never interleave with the new search.
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const invalidFilter = debouncedSearch.length > 0 && !MONGO_ID.test(debouncedSearch);

  // Ignore stale responses when page/search changes race each other.
  const fetchSerial = useRef(0);
  useEffect(() => {
    if (invalidFilter) {
      setLoading(false);
      return;
    }
    const serial = ++fetchSerial.current;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (MONGO_ID.test(debouncedSearch)) params.set("employeeId", debouncedSearch);
        const res = await api.get(`/attendance/all?${params.toString()}`);
        if (fetchSerial.current !== serial) return;
        setRecords(res.data?.data || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
      } catch (err) {
        if (fetchSerial.current !== serial) return;
        setRecords([]);
        setTotal(0);
        setTotalPages(1);
        setError(err?.response?.data?.error || "Failed to load attendance");
        if (err?.response?.status !== 400) toast.error(err?.response?.data?.error || "Failed to load attendance");
      } finally {
        if (fetchSerial.current === serial) setLoading(false);
      }
    })();
  }, [invalidFilter, page, debouncedSearch, reloadKey]);

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
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="records-tab">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by employee ID..."
            className="input pl-10"
            aria-label="Filter by employee ID"
          />
        </div>
        <Badge tone="ink">{total} records</Badge>
      </div>

      {invalidFilter ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="Invalid employee ID"
            description="Enter a 24-character employee ID to filter attendance records."
          />
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="Could not load attendance"
            description={error}
          />
        </div>
      ) : (
        renderRecordsTable()
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

      {totalPages > 1 && renderPager(page, totalPages, setPage)}
    </div>
  );

  function renderRecordsTable() {
    return (
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
    );
  }
};

const renderPager = (page, totalPages, setPage) => (
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
);

const CorrectionsTab = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [busyId, setBusyId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/attendance/corrections/all?${params.toString()}`);
      setRequests(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load correction requests");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const review = async (id, status, adminNote = "") => {
    setBusyId(id);
    try {
      await api.put(`/attendance/corrections/${id}/review`, { status, adminNote });
      toast.success(`Correction request ${status.toLowerCase()}`);
      if (requests.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update request");
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                statusFilter === t.value
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-surface text-ink-600 border-ink-200 hover:bg-ink-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Badge tone="ink">{total} request{total === 1 ? "" : "s"}</Badge>
      </div>

      <div className="card overflow-hidden">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-400 text-sm">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-0">
                    <EmptyState
                      title="No correction requests"
                      description="Employee correction requests will appear here."
                    />
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const name = r.employee
                    ? `${r.employee.firstName || ""} ${r.employee.lastName || ""}`.trim()
                    : "Unknown";
                  return (
                    <tr key={r.id}>
                      <td className="font-medium text-ink-900">{name}</td>
                      <td className="text-ink-600">{formatNepalDate(r.date)}</td>
                      <td className="text-ink-600">{r.checkIn ? formatNepalTime(r.checkIn) : "—"}</td>
                      <td className="text-ink-600">{r.checkOut ? formatNepalTime(r.checkOut) : "—"}</td>
                      <td className="text-ink-600 max-w-[220px]">
                        <span className="block truncate" title={r.reason}>{r.reason}</span>
                      </td>
                      <td><Badge tone={correctionTone(r.status)}>{r.status}</Badge></td>
                      <td className="text-center">
                        {r.status === "PENDING" ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => review(r.id, "APPROVED")}
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-600/10 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => review(r.id, "REJECTED")}
                              disabled={busyId === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 ring-1 ring-rose-600/10 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-ink-400">{r.adminNote || "—"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && renderPager(page, totalPages, setPage)}
    </div>
  );
};

const AdminAttendanceTable = () => {
  const [tab, setTab] = useState("records");

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("records")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            tab === "records"
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-surface text-ink-600 border-ink-200 hover:bg-ink-50"
          }`}
        >
          Attendance Records
        </button>
        <button
          onClick={() => setTab("corrections")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            tab === "corrections"
              ? "bg-primary-600 text-white border-primary-600"
              : "bg-surface text-ink-600 border-ink-200 hover:bg-ink-50"
          }`}
        >
          Correction Requests
        </button>
      </div>

      {tab === "records" ? <RecordsTab /> : <CorrectionsTab />}
    </div>
  );
};

export default AdminAttendanceTable;