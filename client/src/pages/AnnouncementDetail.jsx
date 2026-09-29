import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Megaphone, PartyPopper } from "lucide-react";
import api from "../api/axios.js";
import Loading from "../components/Loading";
import Badge from "../components/ui/Badge";
import { formatDisplayDate } from "../utils/format";

const AnnouncementDetail = () => {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get(`/announcements/${id}`)
      .then((res) => setAnnouncement(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;

  if (error || !announcement) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Megaphone className="w-12 h-12 text-ink-300 mx-auto mb-4" />
        <p className="text-ink-600">This announcement could not be found.</p>
        <Link to="/dashboard" className="btn-secondary mt-6 inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <article className="card overflow-hidden">
        <div className="px-6 sm:px-8 py-6 flex items-center gap-3 border-b border-ink-100">
          <span className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <PartyPopper className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary-700 uppercase tracking-wide">Announcement</p>
            <p className="text-sm text-ink-500">
              {announcement.author?.name || announcement.author?.email || "Admin"} ·{" "}
              {announcement.createdAt ? formatDisplayDate(new Date(announcement.createdAt)) : ""}
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-8">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight flex items-center gap-3 flex-wrap">
            {announcement.title}
            {announcement.pinned && <Badge tone="primary">Pinned</Badge>}
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-ink-700 whitespace-pre-wrap">{announcement.body}</p>
        </div>

        <div className="px-6 sm:px-8 py-4 bg-ink-50 flex items-center justify-between border-t border-ink-100">
          <span className="text-xs text-ink-400">
            Published {announcement.createdAt ? formatDisplayDate(new Date(announcement.createdAt)) : ""}
          </span>
          <Link to="/dashboard" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Go to dashboard →
          </Link>
        </div>
      </article>
    </div>
  );
};

export default AnnouncementDetail;