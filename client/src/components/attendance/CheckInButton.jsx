import { useState } from "react";
import { LogIn, LogOut, CheckCircle2, Clock } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import { formatNepalTime } from "../../utils/format";

const CheckInButton = ({ todayRecord, onAction }) => {
  const [loading, setLoading] = useState(false);

  const handleAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.post("/attendance");
      onAction();
      const type = res.data?.type;
      toast.success(type === "CHECK_OUT" ? "Checked out. Have a great day!" : "Checked in. Welcome!");
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  };

  if (todayRecord?.checkOut) {
    return (
      <div className="mb-7 card p-8 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <p className="text-lg font-semibold text-ink-900">Work day completed</p>
        <p className="text-sm text-ink-500 mt-1">Great job! See you tomorrow.</p>
      </div>
    );
  }

  const isCheckedIn = !!todayRecord?.checkIn;
  const timeLabel = todayRecord?.checkIn ? formatNepalTime(todayRecord.checkIn) : null;

  return (
    <div className="mb-7 card p-8 flex flex-col items-center justify-center text-center">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          isCheckedIn ? "bg-ink-100 text-ink-600" : "bg-primary-50 text-primary-600"
        }`}
      >
        {isCheckedIn ? <LogOut className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
      </div>

      <p className="text-lg font-semibold text-ink-900">
        {isCheckedIn ? "You're checked in" : "Ready to start your day?"}
      </p>
      <p className="text-sm text-ink-500 mt-1">
        {isCheckedIn
          ? timeLabel
            ? `Checked in at ${timeLabel} · click below to clock out.`
            : "Click below to clock out."
          : "Click the button to clock in for today."}
      </p>

      <Button
        onClick={handleAttendance}
        loading={loading}
        className={`mt-5 px-7 h-12 ${isCheckedIn ? "btn-ghost border border-ink-200" : ""}`}
      >
        {loading ? (
          "Processing..."
        ) : isCheckedIn ? (
          <>
            <LogOut className="w-5 h-5" /> Clock Out
          </>
        ) : (
          <>
            <LogIn className="w-5 h-5" /> Clock In
          </>
        )}
      </Button>

      <p className="text-xs text-ink-400 mt-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> Automatic reminders will help you track your shift.
      </p>
    </div>
  );
};

export default CheckInButton;
