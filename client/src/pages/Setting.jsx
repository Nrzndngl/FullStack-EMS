import { useEffect, useState } from "react"
import Loading from "../components/Loading"
import { Lock } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModal from "../components/ChangePasswordModal"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import { useAuth } from "../context/AuthContext.jsx"
import api from "../api/axios.js"
import toast from "react-hot-toast"

const Setting = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

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
