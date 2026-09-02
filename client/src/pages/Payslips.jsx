import { useCallback, useState, useEffect } from "react"
import Loading from "../components/Loading"
import PayslipList from "../components/payslip/PayslipList"
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm"
import BatchGenerateModal from "../components/payslip/BatchGenerateModal"
import PageHeader from "../components/ui/PageHeader"
import Button from "../components/ui/Button"
import { Download, Layers } from "lucide-react"
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
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role_type === 'ADMIN'

  const fetchPayslips = useCallback(async () => {
    try {
      const res = await api.get("/payslips")
      setPayslips(res.data.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayslips()
  }, [fetchPayslips])

  useEffect(() => {
    if (isAdmin) api.get("/employees").then((res) => setEmployees(res.data.filter((e) => !e.isDeleted))).catch(() => { })
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
              <GeneratePayslipForm employees={employees} onSuccess={fetchPayslips} />
            </div>
          )
        }
      />
      <PayslipList payslips={payslips} isAdmin={isAdmin} />
      <BatchGenerateModal open={showBatch} onClose={() => setShowBatch(false)} onSuccess={fetchPayslips} />
    </div>
  )
}

export default Payslips
