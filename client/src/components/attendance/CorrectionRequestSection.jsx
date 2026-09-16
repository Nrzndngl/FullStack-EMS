import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Pencil } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import { formatNepalDate, formatNepalTime } from "../../utils/format";

const TZ = "Asia/Kathmandu";

const statusBadge = (s) => {
  const toneMap = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };
  return (
    <Badge tone={toneMap[s] || "ink"}>
      {s?.charAt(0)}{s?.slice(1).toLowerCase()}
    </Badge>
  );
};

const CorrectionRequestSection = ({ onRequestSent }) => {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Max selectable date = yesterday (today - 1 day in Nepal)
  const maxDate = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  maxDate.setDate(maxDate.getDate() - 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get(`/attendance/corrections/my?page=${page}&pageSize=8`);
      setRequests(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotal(res.data?.total || 0);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const date = fd.get("date");
    const checkIn = fd.get("checkIn");
    const checkOut = fd.get("checkOut");
    const reason = fd.get("reason");

    if (!date || !reason?.trim()) {
      toast.error("Date and reason are required");
      setSaving(false);
      return;
    }

    try {
      await api.post("/attendance/corrections", {
        date,
        checkIn: checkIn ? new Date(checkIn).toISOString() : undefined,
        checkOut: checkOut ? new Date(checkOut).toISOString() : undefined,
        reason: reason.trim(),
      });
      toast.success("Correction request submitted");
      setOpen(false);
      setPage(1);
      fetchRequests();
      onRequestSent?.();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Correction requests</h2>
          <p className="text-sm text-ink-500">
            {total ? `${total} request${total === 1 ? "" : "s"} submitted.` : "No requests yet."}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Pencil className="w-4 h-4" />
          Request correction
        </Button>
      </div>

      {!loading && requests.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Clock}
            title="No correction requests"
            description="Request a correction for a past missed clock-in."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-ink-900">{formatNepalDate(r.date)}</td>
                    <td className="text-ink-600">{r.checkIn ? formatNepalTime(r.checkIn) : "—"}</td>
                    <td className="text-ink-600">{r.checkOut ? formatNepalTime(r.checkOut) : "—"}</td>
                    <td className="text-ink-600 max-w-[200px] truncate">{r.reason}</td>
                    <td>{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-ink-600 px-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request Attendance Correction"
        description="Select the date and provide the correct clock-in / clock-out times."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              name="date"
              required
              max={maxDateStr}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Clock in</label>
              <input type="datetime-local" name="checkIn" className="input" />
            </div>
            <div>
              <label className="field-label">Clock out</label>
              <input type="datetime-local" name="checkOut" className="input" />
            </div>
          </div>

          <div>
            <label className="field-label">Reason</label>
            <textarea
              name="reason"
              required
              rows={3}
              placeholder="Briefly explain why the record needs correction..."
              className="textarea"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {saving ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CorrectionRequestSection;