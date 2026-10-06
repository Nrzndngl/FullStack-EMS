import { useCallback, useState, useEffect, useRef } from "react"
import Loading from "../components/Loading"
import PayslipList from "../components/payslip/PayslipList"
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm"
import BatchGenerateModal from "../components/payslip/BatchGenerateModal"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import { Download, Layers, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import toast from "react-hot-toast"
import { downloadBlob } from "../utils/download"

const Payslips = () => {
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBatch, setShowBatch] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role_type === 'ADMIN'

  // Serial guard so rapid page changes never paint an older page's rows.
  const fetchSerial = useRef(0);
  const fetchPayslips = useCallback(async () => {
    const serial = ++fetchSerial.current;
    try {
      const res = await api.get(`/payslips?page=${page}&pageSize=10`)
      if (fetchSerial.current !== serial) return;
      setPayslips(res.data.data || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (error) {
      if (fetchSerial.current !== serial) return;
      toast.error(error?.response?.data?.error || error?.message)
    } finally {
      if (fetchSerial.current === serial) setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchPayslips()
  }, [fetchPayslips])

  useEffect(() => {
    if (isAdmin) api.get("/employees?pageSize=100").then((res) => {
      const arr = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      setEmployees(arr.filter((e) => !e.isDeleted))
    }).catch(() => { })
  }, [isAdmin])

  if (loading) return <Loading />

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await api.get("/reports/payroll", { responseType: "blob" })
      downloadBlob(res.data, `payroll_${new Date().toISOString().slice(0, 10)}.csv`)
      toast.success("Payroll exported")
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Payslips"
        subtitle={isAdmin ? "Generate and manage employee payslips" : "Your payslip history"}
        action={
          isAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setShowBatch(true)}>
                <Layers className="w-4 h-4" />
                Batch Generate
              </Button>
              <Button variant="secondary" loading={exporting} onClick={exportCsv}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <GeneratePayslipForm employees={employees} onSuccess={() => { setPage(1); fetchPayslips(); }} />
            </div>
          )
        }
      />
      <PayslipList payslips={payslips} isAdmin={isAdmin} />

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

      <BatchGenerateModal open={showBatch} onClose={() => setShowBatch(false)} onSuccess={() => { setPage(1); fetchPayslips(); }} />
    </div>
  )
}

export default Payslips