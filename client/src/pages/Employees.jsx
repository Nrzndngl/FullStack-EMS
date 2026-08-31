import { useCallback, useEffect, useState } from "react";
import { DEPARTMENTS } from "../assets/assets";
import { Plus, Search, Users } from "lucide-react";
import EmployeeCard from "../components/EmployeeCard";
import EmployeeForm from "../components/EmployeeForm";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/axios";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [editEmployee, setEditEmployee] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedDept ? `/employees?department=${encodeURIComponent(selectedDept)}` : "/employees";
      const res = await api.get(url);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const q = search.toLowerCase().trim();
  const filtered = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.position} ${emp.department}`
      .toLowerCase()
      .includes(q)
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Employees"
        subtitle="Manage your team members"
        action={
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="input pl-10"
            aria-label="Search employees"
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="select sm:w-56"
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="animate-pulse space-y-3">
                <div className="w-12 h-12 rounded-full bg-ink-100" />
                <div className="h-4 bg-ink-100 rounded w-1/2" />
                <div className="h-3 bg-ink-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={employees.length === 0 ? "No employees yet" : "No results found"}
            description={
              employees.length === 0
                ? "Add your first employee to get started."
                : "Try adjusting your search or filter."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp._id || emp.id}
              employee={emp}
              onDelete={fetchEmployees}
              onEdit={(e) => setEditEmployee(e)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Employee"
        description="Create a user account and employee profile"
      >
        <EmployeeForm
          onSucess={() => {
            setShowCreateModal(false);
            fetchEmployees();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        title="Edit Employee"
        description="Update employee details"
      >
        {editEmployee && (
          <EmployeeForm
            initialData={editEmployee}
            onSucess={() => {
              setEditEmployee(null);
              fetchEmployees();
            }}
            onCancel={() => setEditEmployee(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Employees;
