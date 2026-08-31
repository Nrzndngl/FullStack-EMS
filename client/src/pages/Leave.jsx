import { useCallback, useState, useEffect } from "react"
import Loading from "../components/Loading"
import { PalmtreeIcon, Plus, ThermometerIcon, UmbrellaIcon } from "lucide-react"
import LeaveHistory from "../components/leave/leaveHistory"
import ApplyLeaveModal from "../components/leave/ApplyLeaveModal"
import PageHeader from "../components/ui/PageHeader"
import StatCard from "../components/ui/StatCard"
import Button from "../components/ui/Button"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import toast from "react-hot-toast"

const Leave = () => {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const isAdmin = user?.role === "ADMIN"

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await api.get("/leaves")
      setLeaves(res.data.data || [])
      if (res.data.employee?.isDeleted) {
        setIsDeleted(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }, [])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  if (loading) return <Loading />

  const sickCount = leaves.filter((l) => l.type === "SICK").length
  const casualCount = leaves.filter((l) => l.type === "CASUAL").length
  const annualCount = leaves.filter((l) => l.type === "ANNUAL").length

  const leaveStats = [
    { label: "Sick Leave Taken", value: sickCount, icon: ThermometerIcon, tone: "danger" },
    { label: "Casual Leave Taken", value: casualCount, icon: UmbrellaIcon, tone: "warning" },
    { label: "Annual Leave Taken", value: annualCount, icon: PalmtreeIcon, tone: "primary" },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle={
          isAdmin
            ? "Review, approve and manage all employee leave applications"
            : "Track your leave balance and apply for time off"
        }
        actions={
          !isAdmin && !isDeleted && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              Apply for Leave
            </Button>
          )
        }
      />

      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {leaveStats.map((s) => (
            <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} tone={s.tone} />
          ))}
        </div>
      )}

      <LeaveHistory leaves={leaves} isAdmin={isAdmin} onUpdate={fetchLeaves} />
      <ApplyLeaveModal open={showModal} onClose={() => setShowModal(false)} onSuccess={fetchLeaves} />
    </div>
  )
}

export default Leave
