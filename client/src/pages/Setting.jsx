import { useEffect, useState } from "react"
import { dummyProfileData } from "../assets/assets"
import Loading from "../components/Loading"
import { Lock } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModal from "../components/ChangePasswordModal"
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
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          Settings
        </h1>
        <p className="page-subtitle">
          Manage your account & preferences.
        </p>
      </div>

      {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile} />}

      {/* Change Password */}
      <div className="card max-w-md p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-lg">
            <Lock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">
              Password
            </p>
            <p className="text-sm text-slate-500">
              Update your account Password.
            </p>
          </div>
        </div>
        <button onClick={() => setShowPassword(true)} className="btn-secondary text-sm">
          Change
        </button>

      </div>

      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />

    </div >
  )
}

export default Setting