import LoginLeftSide from "../components/LoginLeftSide";
import { ArrowRight, Shield, User } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";

const LoginLanding = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const portalOptions = [
    {
      to: "/login/admin",
      title: "Admin Portal",
      description: "Manage employees, attendance, leaves & payroll",
      icon: Shield,
    },
    {
      to: "/login/employee",
      title: "Employee Portal",
      description: "Clock in, apply for leave & view your payslips",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas">
      <LoginLeftSide />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-canvas min-h-screen">
        <div className="w-full max-w-md animate-slide-up">
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <span className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </span>
            <span className="font-semibold text-ink-900">QuickEMS</span>
          </div>

          <div className="mb-9">
            <h2 className="text-3xl font-semibold text-ink-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-ink-500">Select a portal to sign in and continue to your dashboard.</p>
          </div>

          <div className="space-y-4">
            {portalOptions.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.to}
                  to={portal.to}
                  className="group flex items-center gap-4 bg-surface border border-ink-200 rounded-2xl p-5 transition-all hover:border-primary-400 hover:shadow-md hover:shadow-primary-600/5"
                >
                  <span className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-ink-900 group-hover:text-primary-700 transition-colors">
                      {portal.title}
                    </span>
                    <span className="block text-sm text-ink-500 mt-0.5">{portal.description}</span>
                  </span>
                  <ArrowRight className="w-5 h-5 text-ink-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginLanding;
