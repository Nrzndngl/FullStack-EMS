import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileText, DollarSign, Briefcase, Mail, Phone, MapPin } from "lucide-react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import api from "../api/axios";
import { formatNepalDate } from "../utils/format";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr) => formatNepalDate(dateStr);

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [empRes, attRes, leaveRes, payRes] = await Promise.allSettled([
          api.get(`/employees/${id}`),
          api.get(`/attendance/all?employeeId=${id}&pageSize=5`),
          api.get(`/leaves?employeeId=${id}&pageSize=5`),
          api.get(`/payslips?employeeId=${id}&pageSize=5`),
        ]);
        if (empRes.status === "fulfilled") setEmployee(empRes.value.data);
        if (attRes.status === "fulfilled") setAttendance(attRes.value.data?.data || attRes.value.data || []);
        if (leaveRes.status === "fulfilled") setLeaves(leaveRes.value.data?.data || leaveRes.value.data || []);
        if (payRes.status === "fulfilled") setPayslips(payRes.value.data?.data || payRes.value.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 bg-ink-100 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-24 bg-ink-50" />
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="animate-fade-in">
        <p className="text-ink-500">Employee not found.</p>
        <Link to="/employees" className="btn-secondary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Total Attendance", value: employee.attendanceCount ?? 0, icon: CalendarDays, tone: "primary" },
    { label: "Leave Requests", value: employee.leaveCount ?? 0, icon: FileText, tone: "ink" },
    { label: "Pending Leaves", value: employee.pendingLeaves ?? 0, icon: FileText, tone: "warning" },
    { label: "Payslips", value: employee.payslipCount ?? 0, icon: DollarSign, tone: "success" },
  ];

  const empLeaves = leaves.filter((l) => l.employeeId === id || l.employee?._id === id);
  const empPayslips = payslips.filter((p) => p.employeeId === id || p.employee?._id === id);
  const empAttendance = attendance.filter((a) => a.employeeId === id || a.employee?._id === id);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/employees" className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink-900">{employee.firstName} {employee.lastName}</h1>
          <p className="text-sm text-ink-500">{employee.position} · {employee.department}</p>
        </div>
        <Badge className="ml-auto">{employee.employmentStatus}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Profile Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone || "—"} />
            <InfoRow icon={Briefcase} label="Department" value={employee.department} />
            <InfoRow icon={MapPin} label="Position" value={employee.position} />
            <InfoRow icon={CalendarDays} label="Join Date" value={formatDate(employee.joinDate)} />
            <InfoRow icon={DollarSign} label="Basic Salary" value={formatCurrency(employee.basicSalary)} />
          </div>
          {employee.bio && (
            <div className="mt-4 pt-4 border-t border-ink-100 text-sm text-ink-600">
              {employee.bio}
            </div>
          )}
        </Card>

        {/* Quick Stats Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Basic Salary</span>
              <span className="font-medium">{formatCurrency(employee.basicSalary)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Allowances</span>
              <span className="font-medium text-emerald-600">+{formatCurrency(employee.allowances)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Deductions</span>
              <span className="font-medium text-rose-600">-{formatCurrency(employee.deductions)}</span>
            </div>
            <div className="border-t border-ink-100 pt-3 flex justify-between text-sm font-semibold">
              <span className="text-ink-700">Net Salary</span>
              <span>{formatCurrency(employee.basicSalary + employee.allowances - employee.deductions)}</span>
            </div>
            {employee.leaveBalance && (
              <div className="border-t border-ink-100 pt-3 mt-2 space-y-2">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Leave Balances</p>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Sick</span>
                  <span>{employee.leaveBalance.SICK ?? 0} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Casual</span>
                  <span>{employee.leaveBalance.CASUAL ?? 0} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Annual</span>
                  <span>{employee.leaveBalance.ANNUAL ?? 0} days</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Recent Attendance</h3>
        {empAttendance.length === 0 ? (
          <p className="text-sm text-ink-400">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-100">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {empAttendance.map((a) => (
                  <tr key={a._id || a.id} className="border-b border-ink-50">
                    <td className="py-2.5 font-medium">{formatDate(a.date)}</td>
                    <td className="py-2.5">
                      <Badge tone={a.status === "PRESENT" ? "success" : a.status === "LATE" ? "warning" : "danger"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-2.5">{a.workingHours != null ? `${a.workingHours}h` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Leaves */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Recent Leaves</h3>
        {empLeaves.length === 0 ? (
          <p className="text-sm text-ink-400">No leave records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-100">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Start</th>
                  <th className="pb-2 font-medium">End</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {empLeaves.map((l) => (
                  <tr key={l._id || l.id} className="border-b border-ink-50">
                    <td className="py-2.5 font-medium">{l.type}</td>
                    <td className="py-2.5">{formatDate(l.startDate)}</td>
                    <td className="py-2.5">{formatDate(l.endDate)}</td>
                    <td className="py-2.5">
                      <Badge tone={l.status === "APPROVED" ? "success" : l.status === "REJECTED" ? "danger" : "warning"}>
                        {l.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Payslips */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Recent Payslips</h3>
        {empPayslips.length === 0 ? (
          <p className="text-sm text-ink-400">No payslip records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-100">
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Working Days</th>
                  <th className="pb-2 font-medium">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {empPayslips.map((p) => (
                  <tr key={p._id || p.id} className="border-b border-ink-50">
                    <td className="py-2.5 font-medium">{MONTHS[p.month] || p.month} {p.year}</td>
                    <td className="py-2.5">{p.workingDays ?? "—"}</td>
                    <td className="py-2.5 font-semibold">{formatCurrency(p.netSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-ink-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-medium text-ink-800">{value || "—"}</p>
    </div>
  </div>
);

export default EmployeeDetail;