import { useEffect, useState } from "react"
import Loading from "../components/Loading"
import { Lock, Calendar, Moon, Briefcase, Building2, Mail, Phone, CalendarDays, BadgeCheck } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModal from "../components/ChangePasswordModal"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import Avatar from "../components/ui/Avatar"
import { useAuth } from "../context/AuthContext.jsx"
import { getCalendarPref, setCalendarPref, formatNepalDate } from "../utils/format"
import { getTheme, setTheme } from "../utils/theme"
import api from "../api/axios.js"
import toast from "react-hot-toast"

const Setting = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [bsCalendar, setBsCalendar] = useState(getCalendarPref())
  const [darkMode, setDarkMode] = useState(getTheme())

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

      {profile && (
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={`${profile?.firstName || ""} ${profile?.lastName || ""}`}
              src={profile?.image || ""}
              className="w-16 h-16 text-lg"
            />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-ink-900">
                {profile?.firstName || "Account"} {profile?.lastName || ""}
              </h3>
              <p className="text-sm text-ink-500 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-primary-500" />
                {profile?.position || "Employee"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-ink-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">Department</p>
                <p className="text-sm font-medium text-ink-700 truncate">{profile?.department || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-ink-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">Position</p>
                <p className="text-sm font-medium text-ink-700 truncate">{profile?.position || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-ink-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">Joined</p>
                <p className="text-sm font-medium text-ink-700">
                  {profile?.joinDate ? formatNepalDate(profile.joinDate) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-ink-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">Email</p>
                <p className="text-sm font-medium text-ink-700 truncate">{profile?.email || user?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-ink-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">Phone</p>
                <p className="text-sm font-medium text-ink-700 truncate">{profile?.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                <BadgeCheck className="w-4 h-4 text-ink-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-400">Status</p>
                <p className="text-sm font-medium text-ink-700">
                  {profile?.employmentStatus || "ACTIVE"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <Moon className="w-5 h-5 text-ink-500" />
          </div>
          <div>
            <p className="font-medium text-ink-900">Dark mode</p>
            <p className="text-sm text-ink-500">
              {darkMode
                ? "Using the dark color scheme."
                : "Using the light color scheme."}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={darkMode}
            onChange={() => {
              const next = !darkMode
              setDarkMode(next)
              setTheme(next)
            }}
          />
          <span
            className={`w-11 h-6 rounded-full transition-colors ${
              darkMode ? "bg-primary-600" : "bg-ink-200"
            }`}
          />
          <span
            className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              darkMode ? "translate-x-5" : ""
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
