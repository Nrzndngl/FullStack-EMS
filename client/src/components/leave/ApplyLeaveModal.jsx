import { CalendarDays, FileText } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const ApplyLeaveModal = ({ open, onClose, onSuccess, balances }) => {
  const [loading, setLoading] = useState(false);

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

  const remainingFor = (type) => balances?.[type];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    if (data.endDate && data.startDate && data.endDate < data.startDate) {
      toast.error("End date cannot be before start date.");
      setLoading(false);
      return;
    }

    const days = countDays(data.startDate, data.endDate);
    const remaining = remainingFor(data.type);
    if (remaining != null && days > remaining) {
      toast.error(`Insufficient balance: ${days} day(s) requested, ${remaining} remaining for ${data.type}.`);
      setLoading(false);
      return;
    }

    try {
      await api.post("/leaves", data);
      toast.success("Leave application submitted");
      onSuccess?.();
      onClose?.();
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
      onClose={onClose}
      title="Apply for Leave"
      description="Submit your leave request for approval"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="field-label flex items-center gap-2">
            <FileText className="w-4 h-4 text-ink-400" /> Leave Type
          </label>
          <select className="select" name="type" required defaultValue="">
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
              <input className="input" type="date" name="startDate" required min={minDate} />
            </div>
            <div>
              <span className="block text-xs text-ink-500 mb-1.5">To</span>
              <input className="input" type="date" name="endDate" required min={minDate} />
            </div>
          </div>
        </div>

        <div>
          <label className="field-label">Reason</label>
          <textarea
            className="textarea"
            name="reason"
            required
            rows={3}
            placeholder="Briefly describe why you need this leave..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ApplyLeaveModal;
