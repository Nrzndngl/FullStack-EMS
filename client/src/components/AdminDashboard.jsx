import { Building2, CalendarCheck, FileText, Users, ArrowRight, TrendingUp, PieChart, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./ui/StatCard";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";
import { HBarChart, VBarChart } from "./charts/Charts";

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const AdminDashboard = ({ data }) => {
  const stats = [
    { icon: Users, value: data.totalEmployees, label: "Total Employees", hint: "Active workforce", tone: "primary" },
    { icon: Building2, value: data.totalDepartments, label: "Departments", hint: "Organization units", tone: "ink" },
    { icon: CalendarCheck, value: data.todayAttendance, label: "Today's Attendance", hint: "Checked in today", tone: "success" },
    { icon: FileText, value: data.pendingLeaves, label: "Pending Leaves", hint: "Awaiting approval", tone: "warning" },
  ];

  const deptData = (data.departmentDistribution || []).map((d) => ({
    label: d.department,
    value: d.count,
  }));

  const trendData = (data.attendanceTrend || []).map((t) => ({
    label: MONTH_ABBR[t.month - 1],
    value: t.present,
  }));

  const payroll = data.payroll || {};

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Admin. Here's your overview."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <h3 className="text-base font-semibold text-ink-900">Attendance Trend</h3>
            <span className="text-xs text-ink-400 ml-auto">Present days · last 6 months</span>
          </div>
          {trendData.length ? (
            <VBarChart series={trendData} />
          ) : (
            <p className="text-sm text-ink-400">No attendance data yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-4 h-4 text-primary-500" />
            <h3 className="text-base font-semibold text-ink-900">Staff by Department</h3>
          </div>
          {deptData.length ? (
            <HBarChart items={deptData} colorBar="bg-indigo-500" />
          ) : (
            <p className="text-sm text-ink-400">No employees yet.</p>
          )}
        </Card>
      </div>

      {/* Payroll Summary */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Wallet className="w-4 h-4 text-primary-500" />
          <h3 className="text-base font-semibold text-ink-900">Payroll Snapshot</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-xs text-ink-500">Total Basic Salary</p>
            <p className="text-lg font-semibold text-ink-900 mt-1">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(payroll.totalBasic || 0)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600">Total Net Pay</p>
            <p className="text-lg font-semibold text-emerald-700 mt-1">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(payroll.totalNet || 0)}
            </p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs text-indigo-600">Total Overtime (hrs)</p>
            <p className="text-lg font-semibold text-indigo-700 mt-1">
              {Math.round(payroll.totalOvertime || 0)} hrs
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Quick actions</h3>
            <p className="text-sm text-ink-500 mt-0.5">Manage your workforce from here.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/employees" className="btn-primary">
              Manage Employees <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/leave" className="btn-secondary">
              Review Leaves
            </Link>
            <Link to="/payslips" className="btn-secondary">
              Generate Payslips
            </Link>
            <Link to="/audit" className="btn-secondary">
              Audit Log
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;