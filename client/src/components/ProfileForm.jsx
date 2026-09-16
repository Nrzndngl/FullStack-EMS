import { Save, User, Camera } from 'lucide-react'
import { useState } from 'react'
import api from '../api/axios'
import Button from './ui/Button'
import Avatar from './ui/Avatar'

const ProfileForm = ({ initialData, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [image, setImage] = useState(initialData.image || "")
  const [pendingImage, setPendingImage] = useState(null)

  const fullName = `${initialData.firstName || "Admin"} ${initialData.lastName || ""}`.trim()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPendingImage(reader.result)
    reader.readAsDataURL(file)
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const formData = new FormData(e.currentTarget)
    if (pendingImage) formData.append("image", pendingImage)
    try {
      await api.put("/profile", formData)
      if (pendingImage) setImage(pendingImage)
      setPendingImage(null)
      setMessage("Profile updated successfully!")
      onSuccess?.()
    } catch (error) {
      setError(error?.response?.data?.error || error?.message)
    } finally {
      setLoading(false)
    }
  }

  const displayImage = pendingImage || image

  return (
    <form onSubmit={handleSubmit} className='card p-5 sm:p-6 mb-6'>
      <h2 className="text-base font-medium text-ink-900 mb-6 pb-4 border-b border-ink-100 flex items-center gap-2">
        <User className="w-5 h-5 text-ink-400" />
        Public Profile
      </h2>
      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm border border-rose-200 mb-6 items-start gap-3">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-200 mb-6">
          {message}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2 flex items-center gap-4">
            <Avatar name={fullName} src={displayImage} className="w-20 h-20 text-lg" />
            <div>
              <label className="btn-secondary cursor-pointer inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {pendingImage ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFile}
                  disabled={initialData.isDeleted}
                />
              </label>
              <p className="text-xs text-ink-400 mt-1.5">PNG or JPG, max 2MB.</p>
            </div>
          </div>

          <div>
            <label className='field-label'>Name</label>
            <input disabled value={fullName} className='input bg-ink-50 text-ink-400 cursor-not-allowed' />
          </div>

          <div>
            <label className='field-label'>Email</label>
            <input disabled value={initialData.email} className='input bg-ink-50 text-ink-400 cursor-not-allowed' />
          </div>

          <div className='sm:col-span-2'>
            <label className='field-label'>Position</label>
            <input disabled value={initialData.position} className='input bg-ink-50 text-ink-400 cursor-not-allowed' />
          </div>

          <div className='sm:col-span-2'>
            <label className='field-label'>Bio</label>
            <textarea
              className='textarea resize-none'
              name="bio"
              defaultValue={initialData.bio || ""}
              disabled={initialData.isDeleted}
              placeholder='Write a brief bio...'
            />
            <p className="text-xs text-ink-400 mt-1.5">
              This will be displayed on your profile.
            </p>
          </div>

          {initialData.isDeleted ? (
            <div className="sm:col-span-2 pt-2">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <p className="text-rose-600 font-medium tracking-tight">Account Deactivated</p>
                <p className="text-xs text-rose-500 mt-1">This account is no longer active.</p>
              </div>
            </div>
          ) : (
            <div className='sm:col-span-2 flex justify-end pt-2'>
              <Button type="submit" loading={loading} className="w-full sm:w-auto">
                <Save className='w-4 h-4' /> Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

export default ProfileForm