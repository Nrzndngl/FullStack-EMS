import { Pencil, Trash2 } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";

const EmployeeCard = ({ employee, onDelete, onEdit }) => {
  const employeeId = employee._id || employee.id;
  const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${fullName}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/employees/${employeeId}`);
      toast.success("Employee deleted");
      onDelete?.();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }
  };

  return (
    <div className="group card p-5 hover:shadow-md hover:shadow-ink-900/5 transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <Avatar name={fullName} className="w-12 h-12 text-sm" />
        <Badge tone={employee.isDeleted ? "ink" : "primary"}>{employee.department || "Remote"}</Badge>
      </div>

      <h3 className="text-ink-900 font-semibold truncate">{fullName}</h3>
      <p className="text-sm text-ink-500 truncate">{employee.position}</p>

      <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between">
        <span className="text-xs text-ink-400">
          {employee.isDeleted ? "Deactivated" : "Active"}
        </span>
        {!employee.isDeleted && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(employee)}
              aria-label={`Edit ${fullName}`}
              className="p-2 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              aria-label={`Delete ${fullName}`}
              className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;
