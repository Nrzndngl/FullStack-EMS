import { useEffect, useState } from "react";
import {
  CalendarCheck,
  FileText,
  LogIn,
  Plane,
  Wallet,
  Timer,
  CalendarClock,
  Megaphone,
  Info,
  PartyPopper,
} from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "./ui/StatCard";
import PageHeader from "./ui/PageHeader";
import Card from "./ui/Card";
import Avatar from "./ui/Avatar";
import { formatNPR, formatDisplayDate } from "../utils/format";
import api from "../api/axios.js";

const LEAVE_LABELS = {
  SICK: "Sick",
  CASUAL: "Casual",
  ANNUAL: "Annual",
};

const OnboardingHint = ({ icon: Icon, title, desc, to }) => (
  <Link
    to={to}
    className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-ink-200 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
  >
    <span className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </span>
    <span>
      <span className="block text-sm font-semibold text-ink-900">{title}</span>
      <span className="block text-xs text-ink-500 mt-0.5">{desc}</span>
    </span>
  </Link>
);

const EmployeeDashboard = ({ data }) => {
  const emp = data.employee;
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api
      .get("/announcements?limit=4")
      .then((res) => setAnnouncements(res.data?.data || []))
      .catch(() => {});
  }, []);

  const cards = [
    { icon: CalendarCheck, value: data.currentMonthAttendance, label: "Days Present", hint: "This month", tone: "primary" },
    { icon: FileText, value: data.pendingLeaves, label: "Pending Leaves", hint: "Awaiting approval", tone: "warning" },
    {
      icon: Timer,
      value: data.currentMonthOvertime ? `${data.currentMonthOvertime} hrs` : "0 hrs",
      label: "Overtime",
      hint: "This month",
      tone: "ink",
    },
  ];

  const balances = emp?.leaveBalance || {};
  const entitlements = data.leaveEntitlements || {};
  const leaveTypes = ["SICK", "CASUAL", "ANNUAL"];

  const latest = data.latestPayslip;

  const onboardingHints = [];
  if (data.onboarding) {
    if (!data.onboarding.hasAttendance) {
      onboardingHints.push({
        icon: LogIn,
        title: "Mark your first attendance",
        desc: "Clock in once you arrive at work to start tracking your hours.",
        to: "/attendance",
      });
    }
    if (!data.onboarding.hasLeave) {
      onboardingHints.push({
        icon: Plane,
        title: "Request your first leave",
        desc: "Sick, casual and annual leave are available to apply for.",
        to: "/leave",
      });
    }
    if (!data.onboarding.hasPayslip) {
      onboardingHints.push({
        icon: Wallet,
        title: "Check your payslips",
        desc: "Once payroll is generated you'll find your salary details here.",
        to: "/payslips",
      });
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar
              name={`${emp?.firstName || ""} ${emp?.lastName || ""}`}
              src={emp?.image || ""}
              className="w-11 h-11 text-sm"
            />
            <span>Welcome, {emp?.firstName || "Employee"}!</span>
          </span>
        }
        subtitle={`${emp?.position || "Team Member"} · ${emp?.department || "No Department"}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {data.nextHoliday && (
        <div className="card flex items-center gap-4 p-5 bg-primary-50/60 border-primary-200/70">
          <span className="w-11 h-11 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary-700 uppercase tracking-wide">Next holiday</p>
            <p className="font-semibold text-ink-900 truncate">
              {data.nextHoliday.name}
            </p>
            <p className="text-xs text-ink-500">{formatDisplayDate(new Date(data.nextHoliday.date + "T00:00:00"))}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave credit meters */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink-900 mb-1">Leave balance</h3>
          <p className="text-sm text-ink-500 mb-5">Remaining days this year.</p>
          <div className="space-y-5">
            {leaveTypes.map((t) => {
              const remaining = balances[t] ?? 0;
              const total = entitlements[t] ?? remaining;
              const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
              const barTone =
                pct === 0 ? "bg-rose-500" : pct <= 25 ? "bg-amber-500" : "bg-primary-500";
              return (
                <div key={t}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-ink-700">
                      {LEAVE_LABELS[t]} Leave
                    </span>
                    <span className="text-sm text-ink-500">
                      <strong className="text-ink-900">{remaining}</strong> / {total} days
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barTone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Latest payslip breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-ink-900">Latest payslip</h3>
              <p className="text-sm text-ink-500 mt-0.5">
                {latest ? `Generated for the most recent payroll cycle.` : "No payslip generated yet."}
              </p>
            </div>
            {latest && (
              <Link to="/payslips" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all
              </Link>
            )}
          </div>

          {latest ? (
            <div className="space-y-3">
              {[
                { label: "Basic salary", value: formatNPR(latest.basicSalary) },
                { label: "Allowances", value: formatNPR(latest.allowances) },
                { label: "Deductions", value: `−${formatNPR(latest.deductions)}` },
                ...(latest.overtimeHours ? [{ label: "Overtime hours", value: `${latest.overtimeHours} hrs` }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">{row.label}</span>
                  <span className="font-medium text-ink-700">{row.value}</span>
                </div>
              ))}
              <div className="h-px bg-ink-100" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900">Net salary</span>
                <span className="text-lg font-bold text-ink-900">{formatNPR(latest.netSalary)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 text-ink-400">
              <Wallet className="w-10 h-10 mb-3 opacity-60" />
              <p className="text-sm">Your payslips will appear here automatically.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink-900 mb-1 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary-600" />
            Announcements
          </h3>
          <div className="mt-4 space-y-4">
            {announcements.map((a) => (
              <div key={a.id} className="flex gap-4">
                <span className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <PartyPopper className="w-4.5 h-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 flex items-center gap-2 flex-wrap">
                    {a.title}
                    {a.pinned && (
                      <span className="badge badge-primary !text-[10px]">Pinned</span>
                    )}
                  </p>
                  <p className="text-sm text-ink-600 mt-0.5 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-ink-400 mt-1">
                    {a.author?.name || a.author?.email || "Admin"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Onboarding hints */}
      {onboardingHints.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-ink-900 mb-1 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary-600" />
            Getting started
          </h3>
          <p className="text-sm text-ink-500 mb-5">A few things you can do to get set up.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {onboardingHints.map((h) => (
              <OnboardingHint key={h.title} {...h} />
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
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