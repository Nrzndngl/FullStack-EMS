import { useCallback, useState, useEffect, useRef } from "react"
import Loading from "../components/Loading"
import { PalmtreeIcon, Plus, ThermometerIcon, UmbrellaIcon, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [balances, setBalances] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const isAdmin = user?.role === "ADMIN"

  // Serial guard so rapid page changes never paint an older page's rows.
  const fetchSerial = useRef(0);
  const fetchLeaves = useCallback(async () => {
    const serial = ++fetchSerial.current;
    try {
      const res = await api.get(`/leaves?page=${page}&pageSize=10`)
      if (fetchSerial.current !== serial) return;
      setLeaves(res.data.data || [])
      setBalances(res.data.employee?.leaveBalance || null)
      setTotalPages(res.data.totalPages || 1)
      if (res.data.employee?.isDeleted) {
        setIsDeleted(true);
      }
    } catch (error) {
      if (fetchSerial.current !== serial) return;
      toast.error(error.response?.data?.error || error.message);
    } finally {
      if (fetchSerial.current === serial) setLoading(false);
    }
  }, [page])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  if (loading) return <Loading />

  const sickCount = leaves.filter((l) => l.type === "SICK").length
  const casualCount = leaves.filter((l) => l.type === "CASUAL").length
  const annualCount = leaves.filter((l) => l.type === "ANNUAL").length

  const leaveStats = [
    { label: "Sick Leave Remaining", value: balances?.SICK ?? sickCount, icon: ThermometerIcon, tone: "danger" },
    { label: "Casual Leave Remaining", value: balances?.CASUAL ?? casualCount, icon: UmbrellaIcon, tone: "warning" },
    { label: "Annual Leave Remaining", value: balances?.ANNUAL ?? annualCount, icon: PalmtreeIcon, tone: "primary" },
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
        action={
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

      <LeaveHistory leaves={leaves} isAdmin={isAdmin} onUpdate={() => { setPage(1); fetchLeaves(); }} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-ink-600 px-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-ink-200 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <ApplyLeaveModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { setPage(1); fetchLeaves(); }} balances={balances} />
    </div>
  )
}

export default Leave