import { CalendarCheck, FileText, Wallet, LogIn, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./ui/StatCard";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import { formatNPR } from "../utils/format";

const EmployeeDashboard = ({ data }) => {
  const emp = data.employee;

  const cards = [
    { icon: CalendarCheck, value: data.currentMonthAttendance, label: "Days Present", hint: "This month", tone: "primary" },
    { icon: FileText, value: data.pendingLeaves, label: "Pending Leaves", hint: "Awaiting approval", tone: "warning" },
    {
      icon: Wallet,
      value: data.latestPayslip ? formatNPR(data.latestPayslip.netSalary) : "N/A",
      label: "Latest Payslip",
      hint: data.latestPayslip ? "Most recent payout" : "No payslip yet",
      tone: "success",
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={`${emp?.firstName || ""} ${emp?.lastName || ""}`} className="w-11 h-11 text-sm" />
            <span>Welcome, {emp?.firstName || "Employee"}!</span>
          </span>
        }
        subtitle={`${emp?.position || "Team Member"} · ${emp?.department || "No Department"}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-ink-900 mb-1">What would you like to do?</h3>
        <p className="text-sm text-ink-500 mb-5">Jump straight into your most common tasks.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/attendance" className="btn-primary justify-center h-12">
            <LogIn className="w-5 h-5" />
            Mark Attendance
          </Link>
          <Link to="/leave" className="btn-secondary justify-center h-12">
            <Plane className="w-5 h-5" />
            Apply for Leave
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
