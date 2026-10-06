import { useCallback, useEffect, useState } from "react";
import { DEPARTMENTS } from "../assets/assets";
import { Plus, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import EmployeeCard from "../components/EmployeeCard";
import EmployeeForm from "../components/EmployeeForm";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/axios";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [editEmployee, setEditEmployee] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const pageSize = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (selectedDept) params.set("department", selectedDept);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await api.get(`/employees?${params.toString()}`);
      const payload = res.data;
      if (Array.isArray(payload.data)) {
        setEmployees(payload.data);
        setTotalPages(payload.totalPages || 1);
      } else if (Array.isArray(payload)) {
        setEmployees(payload);
        setTotalPages(1);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      setEmployees([]);
      setTotalPages(1);
      setError(err?.response?.data?.error || err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, selectedDept, debouncedSearch]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDeleted = useCallback(() => {
    if (employees.length <= 1 && page > 1) setPage((p) => p - 1);
    else fetchEmployees();
  }, [employees.length, page, fetchEmployees]);

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
          onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
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
      ) : error ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="Could not load employees"
            description={error}
          />
          <div className="flex justify-center pb-5">
            <Button onClick={() => fetchEmployees()}>Retry</Button>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={debouncedSearch ? "No results found" : "No employees yet"}
            description={
              debouncedSearch
                ? "Try adjusting your search or filter."
                : "Add your first employee to get started."
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {employees.map((emp) => (
              <EmployeeCard
                key={emp._id || emp.id}
                employee={emp}
                onDelete={handleDeleted}
                onEdit={(e) => setEditEmployee(e)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-600 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
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