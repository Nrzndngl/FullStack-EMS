import { CalendarDays, FileText } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const ApplyLeaveModal = ({ open, onClose, onSuccess, balances }) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const countDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return Math.round((e - s) / 86400000) + 1;
  };

  const remainingFor = (t) => balances?.[t];
  const days = startDate && endDate && endDate >= startDate ? countDays(startDate, endDate) : 0;
  const remaining = remainingFor(type);
  const overBalance = remaining != null && days > remaining;
  const invalidRange = startDate && endDate && endDate < startDate;

  const reset = () => {
    setLoading(false);
    setType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const handleClose = () => {
    onClose?.();
    reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (overBalance) {
      toast.error(`Insufficient balance: ${days} day(s) requested, ${remaining} remaining for ${type}.`);
      return;
    }
    setLoading(true);

    try {
      await api.post("/leaves", { type, startDate, endDate, reason });
      toast.success("Leave application submitted");
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.error || error?.message || "Failed to submit");
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "SICK", label: "Sick Leave", balance: remainingFor("SICK") },
    { value: "CASUAL", label: "Casual Leave", balance: remainingFor("CASUAL") },
    { value: "ANNUAL", label: "Annual Leave", balance: remainingFor("ANNUAL") },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Apply for Leave"
      description="Submit your leave request for approval"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="field-label flex items-center gap-2">
            <FileText className="w-4 h-4 text-ink-400" /> Leave Type
          </label>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="" disabled>
              Select type
            </option>
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
                {t.balance != null ? ` (${t.balance} left)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-ink-400" /> Leave Duration
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs text-ink-500 mb-1.5">From</span>
              <input
                className="input"
                type="date"
                value={startDate}
                min={minDate}
                required
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </div>
            <div>
              <span className="block text-xs text-ink-500 mb-1.5">To</span>
              <input
                className="input"
                type="date"
                value={endDate}
                min={startDate || minDate}
                required
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {days > 0 && (
            <div className={`mt-2 text-sm ${overBalance ? "text-rose-600 font-medium" : "text-ink-600"}`}>
              {overBalance
                ? `${days} day(s) requested, but only ${remaining} ${type} day(s) remaining.`
                : remaining != null
                ? `${days} day(s) · ${remaining - days} ${type} day(s) remaining after request`
                : `${days} day(s) selected`}
            </div>
          )}
          {invalidRange && <div className="mt-2 text-sm text-rose-600 font-medium">End date is before start date.</div>}
        </div>

        <div>
          <label className="field-label">Reason</label>
          <textarea
            className="textarea"
            value={reason}
            required
            rows={3}
            placeholder="Briefly describe why you need this leave..."
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1" disabled={overBalance}>
            {loading ? "Submitting..." : overBalance ? "Insufficient balance" : "Submit Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplyLeaveModal;