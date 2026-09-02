import { useState } from "react";
import { Layers } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const now = new Date();

const BatchGenerateModal = ({ open, onClose, onSuccess }) => {
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/payslips/batch", { month: Number(month), year: Number(year) });
      toast.success(
        `Generated ${res.data.created} payslip(s)` +
          (res.data.skipped ? `, skipped ${res.data.skipped} existing` : "")
      );
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Batch Generate Payslips" description="Generate payslips for all active employees" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-ink-500">
          Payslips are built from each employee's profile. Worked days are counted from their attendance
          records for the selected month.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Month</label>
            <select className="select" value={month} onChange={(e) => setMonth(e.target.value)} required>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Year</label>
            <input className="input" type="number" min="2000" max="2200" value={year} onChange={(e) => setYear(e.target.value)} required />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            <Layers className="w-4 h-4" />
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BatchGenerateModal;