import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import api from "../api/axios";
import { Link } from "react-router-dom";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/notifications?pageSize=15");
      setNotifications(res.data?.data || []);
      setUnread(res.data?.unread || 0);
    } catch {
      // ignore - notifications are best-effort
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(true), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await api.put("/notifications/read-all");
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className="relative p-2 rounded-lg hover:bg-ink-100 text-ink-600 transition-colors"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        role="button"
      >
        {unread > 0 ? <BellRing className="w-[18px] h-[18px]" /> : <Bell className="w-[18px] h-[18px]" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface border border-ink-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                aria-label="Mark all notifications as read"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || n.id}
                  onClick={() => !n.read && markRead(n._id || n.id)}
                  className={`px-4 py-3 border-b border-ink-50 last:border-0 cursor-pointer transition-colors ${
                    n.read ? "bg-surface hover:bg-ink-50" : "bg-primary-50/40 hover:bg-primary-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        n.read ? "bg-ink-200" : "bg-primary-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.read ? "text-ink-600" : "text-ink-900 font-medium"}`}>{n.title}</p>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;