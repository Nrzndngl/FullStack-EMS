import { useCallback, useEffect, useState } from "react";
import { Megaphone, Plus, Pin, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get(`/announcements/all?page=${page}&pageSize=10`);
      setAnnouncements(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title").trim(),
      body: fd.get("body").trim(),
      pinned: fd.get("pinned") === "on",
    };
    try {
      if (editing) {
        await api.put(`/announcements/${editing.id}`, body);
        toast.success("Announcement updated");
      } else {
        await api.post("/announcements", body);
        toast.success("Announcement published");
      }
      setEditing(null);
      fetchAnnouncements();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/announcements/${a.id}`);
      toast.success("Announcement deleted");
      if (announcements.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchAnnouncements();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete announcement");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Publish company-wide updates for your team."
        action={
          <Button onClick={() => setEditing({})}>
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        }
      />

      {!loading && announcements.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Share updates with your employees — pinned posts stay on top."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 flex items-center gap-2 flex-wrap">
                    {a.title}
                    {a.pinned && <Badge tone="primary"><Pin className="w-3 h-3" /> Pinned</Badge>}
                  </p>
                  <p className="text-sm text-ink-600 mt-1 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-ink-400 mt-2">
                    {a.author?.name || a.author?.email || "Admin"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(a)}
                    className="p-2 rounded-lg text-ink-400 hover:text-primary-600 hover:bg-ink-50 transition-colors"
                    aria-label="Edit announcement"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="p-2 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-ink-600 px-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit Announcement" : "New Announcement"}
        description="This will be shown on every employee dashboard."
        maxWidth="max-w-lg"
      >
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Title</label>
              <input
                name="title"
                required
                defaultValue={editing.title || ""}
                className="input"
                placeholder="e.g. Office closed for Dashain"
              />
            </div>
            <div>
              <label className="field-label">Message</label>
              <textarea
                name="body"
                required
                rows={4}
                defaultValue={editing.body || ""}
                className="textarea"
                placeholder="Write your announcement..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer select-none">
              <input
                type="checkbox"
                name="pinned"
                defaultChecked={Boolean(editing.pinned)}
                className="w-4 h-4 accent-primary-600"
              />
              <Pin className="w-4 h-4 text-ink-400" />
              Pin to top
            </label>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" type="button" className="flex-1" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} className="flex-1">
                {saving ? "Saving..." : editing?.id ? "Save Changes" : "Publish"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Announcements;