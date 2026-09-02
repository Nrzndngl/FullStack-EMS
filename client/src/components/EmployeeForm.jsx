import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS } from "../assets/assets";
import { UserPlus, UserCog } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Button from "./ui/Button";

const Field = ({ label, required, children, className = "", colSpan }) => (
  <div className={`${colSpan ? "sm:col-span-2" : ""} ${className}`}>
    <label className="field-label">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-ink-50/60 border border-ink-100 rounded-2xl p-5">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800 mb-4 pb-3 border-b border-ink-100">
      <Icon className="w-4 h-4 text-ink-400" />
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  </div>
);

const EmployeeForm = ({ initialData, onSucess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (isEditMode) {
      const pwd = formData.get("password");
      if (!pwd) formData.delete("password");
    }

    try {
      const url = isEditMode ? `/employees/${initialData.id || initialData._id}` : "/employees";
      const method = isEditMode ? "put" : "post";
      await api[method](url, formData);
      toast.success(isEditMode ? "Employee updated" : "Employee created");
      onSucess ? onSucess() : navigate("/employees");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const dateValue = initialData?.joinDate
    ? new Date(initialData.joinDate).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section icon={UserPlus} title="Personal Information">
        <Field label="First Name" required>
          <input className="input" name="firstName" required defaultValue={initialData?.firstName} />
        </Field>
        <Field label="Last Name" required>
          <input className="input" name="lastName" required defaultValue={initialData?.lastName} />
        </Field>
        <Field label="Phone Number" required>
          <input className="input" name="phone" required defaultValue={initialData?.phone} />
        </Field>
        <Field label="Join Date" required>
          <input className="input" type="date" name="joinDate" required defaultValue={dateValue} />
        </Field>
        <Field label="Bio (Optional)" colSpan>
          <textarea className="textarea" name="bio" rows={3} defaultValue={initialData?.bio || ""} placeholder="A brief description..." />
        </Field>
      </Section>

      <Section icon={UserCog} title="Employment Details">
        <Field label="Department" required>
          <select className="select" name="department" defaultValue={initialData?.department || ""} required>
            <option value="" disabled>
              Select department
            </option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Position" required>
          <input className="input" name="position" required defaultValue={initialData?.position} />
        </Field>
        <Field label="Basic Salary" required>
          <input className="input" type="number" name="basicSalary" min="0" step="0.01" required defaultValue={initialData?.basicSalary || 0} />
        </Field>
        <Field label="Allowances">
          <input className="input" type="number" name="allowances" min="0" step="0.01" defaultValue={initialData?.allowances || 0} />
        </Field>
        <Field label="Deductions">
          <input className="input" type="number" name="deductions" min="0" step="0.01" defaultValue={initialData?.deductions || 0} />
        </Field>
        {isEditMode && (
          <Field label="Employment Status">
            <select className="select" name="employmentStatus" defaultValue={initialData?.employmentStatus || "ACTIVE"}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </Field>
        )}
      </Section>

      <Section icon={UserCog} title="Account Setup">
        <Field label="Work Email" required colSpan>
          <input className="input" type="email" name="email" required defaultValue={initialData?.email} />
        </Field>
        {!isEditMode && (
          <Field label="Temporary Password" required>
            <input className="input" type="password" name="password" required autoComplete="new-password" />
          </Field>
        )}
        {isEditMode && (
          <Field label="Change Password">
            <input className="input" type="password" name="password" placeholder="Leave blank to keep current" autoComplete="new-password" />
          </Field>
        )}
        <Field label="System Role">
          <select className="select" name="role" defaultValue={initialData?.user?.role || "EMPLOYEE"}>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>
      </Section>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={() => (onCancel ? onCancel() : navigate(-1))}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEditMode ? "Update Employee" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
