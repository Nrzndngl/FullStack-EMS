import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarIcon,
  FileTextIcon,
  LayoutGridIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  DollarSignIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./ui/Avatar";

const Sidebar = ({ userName, mobileOpen, setMobileOpen }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role || user?.role_type;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGridIcon },
    role === "ADMIN"
      ? { name: "Employees", href: "/employees", icon: UserIcon }
      : { name: "Attendance", href: "/attendance", icon: CalendarIcon },
    { name: "Leave", href: "/leave", icon: FileTextIcon },
    { name: "Payslips", href: "/payslips", icon: DollarSignIcon },
  ];

  const primaryItems = navItems.filter((i) => i.href !== "/setting");
  const secondaryItems = [{ name: "Settings", href: "/setting", icon: SettingsIcon }];

  useEffect(() => {
    setMobileOpen?.(false);
  }, [pathname, setMobileOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const nav = (items) => (
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            to={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            }`}
          >
            <item.icon
              className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-primary-600" : "text-ink-400 group-hover:text-ink-600"}`}
            />
            <span className="flex-1">{item.name}</span>
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-primary-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const content = (
    <>
      <div className="flex items-center justify-between h-16 px-5 border-b border-ink-100">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
            <LayoutGridIcon className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink-900">QuickEMS</span>
            <span className="block text-[11px] text-ink-400">Management System</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen?.(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-ink-100 text-ink-500"
          aria-label="Close menu"
        >
          <XIcon size={20} />
        </button>
      </div>

      {userName && (
        <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-ink-50 border border-ink-100 flex items-center gap-3">
          <Avatar name={userName} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">{userName}</p>
            <p className="text-xs text-ink-400 truncate">{role === "ADMIN" ? "Administrator" : "Employee"}</p>
          </div>
        </div>
      )}

      <div className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        Menu
      </div>
      {nav(primaryItems)}

      <div className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        Account
      </div>
      {nav(secondaryItems)}

      <div className="p-3 border-t border-ink-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOutIcon className="w-[18px] h-[18px]" />
          <span>Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-surface border-b border-ink-100 flex items-center px-4">
        <button onClick={() => setMobileOpen?.(true)} className="p-2 -ml-2 rounded-lg hover:bg-ink-100 text-ink-600" aria-label="Open menu">
          <MenuIcon size={22} />
        </button>
        <span className="ml-2 text-sm font-semibold text-ink-900">QuickEMS</span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/45 backdrop-blur-sm" onClick={() => setMobileOpen?.(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface flex flex-col animate-slide-in-left shadow-2xl">
            {content}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface border-r border-ink-100 sticky top-0 h-screen">
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
