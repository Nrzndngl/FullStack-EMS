import { useEffect, useState } from "react"
import Loading from "../components/Loading"
import { Lock, Calendar } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModal from "../components/ChangePasswordModal"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import { useAuth } from "../context/AuthContext.jsx"
import { getCalendarPref, setCalendarPref } from "../utils/format"
import api from "../api/axios.js"
import toast from "react-hot-toast"

const Setting = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [bsCalendar, setBsCalendar] = useState(getCalendarPref())

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile")
      const profile = res.data;
      if (profile) setProfile(profile)
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  if (loading) return <Loading />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account & preferences."
      />

      {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile} />}

      <div className="card max-w-md p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ink-50 rounded-lg">
            <Calendar className="w-5 h-5 text-ink-500" />
          </div>
          <div>
            <p className="font-medium text-ink-900">Calendar</p>
            <p className="text-sm text-ink-500">
              {bsCalendar
                ? "Showing dates in Bikram Sambat (BS)."
                : "Display dates in the Gregorian calendar."}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={bsCalendar}
            onChange={() => {
              const next = !bsCalendar
              setBsCalendar(next)
              setCalendarPref(next)
            }}
          />
          <span
            className={`w-11 h-6 rounded-full transition-colors ${
              bsCalendar ? "bg-primary-600" : "bg-ink-200"
            }`}
          />
          <span
            className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              bsCalendar ? "translate-x-5" : ""
            }`}
          />
        </label>
      </div>

      <div className="card max-w-md p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ink-50 rounded-lg">
            <Lock className="w-5 h-5 text-ink-500" />
          </div>
          <div>
            <p className="font-medium text-ink-900">Password</p>
            <p className="text-sm text-ink-500">Update your account password.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setShowPassword(true)}>
          Change
        </Button>
      </div>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
    </div>
  )
}

export default Setting
