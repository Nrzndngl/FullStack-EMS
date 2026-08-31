import { Building2, CalendarCheck, FileText, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./ui/StatCard";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";

const AdminDashboard = ({ data }) => {
  const stats = [
    { icon: Users, value: data.totalEmployees, label: "Total Employees", hint: "Active workforce", tone: "primary" },
    { icon: Building2, value: data.totalDepartments, label: "Departments", hint: "Organization units", tone: "ink" },
    { icon: CalendarCheck, value: data.todayAttendance, label: "Today's Attendance", hint: "Checked in today", tone: "success" },
    { icon: FileText, value: data.pendingLeaves, label: "Pending Leaves", hint: "Awaiting approval", tone: "warning" },
  ];

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
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
