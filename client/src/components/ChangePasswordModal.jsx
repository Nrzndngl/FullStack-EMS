import { useState } from "react";
import api from "../api/axios";
import Button from "./ui/Button";
import Modal from "./ui/Modal";

const ChangePasswordModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters." });
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
      if (!data.success) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: "Password changed successfully!" });
      e.target.reset();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Password"
      description="Update your account password"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {message.text && (
          <div
            className={`p-3 rounded-xl text-sm flex items-start gap-3 border ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                message.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {message.text}
          </div>
        )}

        <div>
          <label className="field-label">Current Password</label>
          <input className="input" type="password" name="currentPassword" required />
        </div>

        <div>
          <label className="field-label">New Password</label>
          <input className="input" type="password" name="newPassword" required minLength={8} />
          <p className="text-xs text-ink-400 mt-1.5">Minimum 8 characters.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
