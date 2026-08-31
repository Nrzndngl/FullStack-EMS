import { format } from "date-fns";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

const statusTone = (status) =>
  status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning";

const LeaveHistory = ({ leaves, isAdmin, onUpdate }) => {
  const [processing, setProcessing] = useState(null);

  const handleStatusUpdate = async (id, status) => {
    setProcessing(id);
    try {
      await api.patch(`/leaves/${id}`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      onUpdate?.();
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatRange = (leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    if (leave.startDate === leave.endDate) return format(start, "MMM dd, yyyy");
    return `${format(start, "MMM dd")} – ${format(end, "MMM dd, yyyy")}`;
  };

  return (
    <div className="card overflow-hidden">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              {isAdmin && <th className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 4} className="py-0">
                  <EmptyState title="No leave applications found" description="Leave requests will appear here." />
                </td>
              </tr>
            ) : (
              leaves.map((leave) => {
                const id = leave._id || leave.id;
                return (
                  <tr key={id}>
                    {isAdmin && (
                      <td className="text-ink-900 font-medium">
                        {(leave.employee?.firstName || "") + " " + (leave.employee?.lastName || "")}
                      </td>
                    )}
                    <td>
                      <Badge tone="ink">{leave.type}</Badge>
                    </td>
                    <td className="text-ink-600">{formatRange(leave)}</td>
                    <td className="max-w-xs truncate text-ink-500" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td>
                      <Badge tone={statusTone(leave.status)}>{leave.status}</Badge>
                    </td>
                    {isAdmin && (
                      <td>
                        {leave.status === "PENDING" && (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(id, "APPROVED")}
                              disabled={!!processing}
                              aria-label="Approve"
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {processing === id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(id, "REJECTED")}
                              disabled={!!processing}
                              aria-label="Reject"
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                            >
                              {processing === id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveHistory;
