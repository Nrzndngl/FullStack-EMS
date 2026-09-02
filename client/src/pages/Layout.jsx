import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import { todayDisplay } from "../utils/format";

const Layout = () => {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <Loading />;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const name =
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "") ||
    user?.email ||
    "User";

  return (
    <div className="min-h-screen bg-canvas flex">
      <Sidebar userName={name.trim() || undefined} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 lg:pl-0 min-w-0">
        {/* Desktop topbar */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between px-8 bg-surface/80 backdrop-blur border-b border-ink-100">
          <p className="text-sm text-ink-500">
            Welcome back, <span className="font-medium text-ink-900">{name.split(" ")[0]}</span>
          </p>
          <span className="text-xs text-ink-400">
            {todayDisplay()}
          </span>
        </header>

        {/* Mobile spacer for fixed top bar */}
        <div className="lg:hidden h-14" />

        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
