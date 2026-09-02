import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Loading from "../components/Loading"
import { format } from "date-fns"
import api from "../api/axios"
import Button from "../components/ui/Button"
import { Printer } from "lucide-react"
import { formatNPR } from "../utils/format"

const PrintPayslip = () => {
  const { id } = useParams()
  const [payslip, setPayslip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/payslips/${id}`).then((res) => setPayslip(res.data)).catch(console.error).finally(() => setLoading(false))
  }, [id])
  if (loading) return <Loading />
  if (!payslip) return <div className="text-center py-12 text-slate-400">Payslip not found</div>

  const period = format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")

  const rows = [
    { label: "Basic Salary", value: `+${formatNPR(payslip.basicSalary)}`, tone: "base" },
    { label: "Allowances", value: `+${formatNPR(payslip.allowances)}`, tone: "base" },
    { label: "Deductions", value: `-${formatNPR(payslip.deductions)}`, tone: "danger" },
    { label: "Net Salary", value: formatNPR(payslip.netSalary), tone: "strong" },
  ]

  const details = [
    { label: "Employee Name", value: (payslip.employee?.firstName || "") + " " + (payslip.employee?.lastName || "") },
    { label: "Position", value: payslip.employee?.position },
    { label: "Email", value: payslip.employee?.email },
    { label: "Period", value: period },
  ]

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 animate-fade-in print:p-0 print:max-w-none">
      <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden print:shadow-none print:border-0">
        <div className="border-b border-ink-100 px-8 py-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold mb-1">FullStack EMS</p>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">PAYSLIP</h1>
          <p className="text-ink-500 text-sm mt-1">{period}</p>
        </div>

        <div className="px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {details.map((d) => (
              <div key={d.label}>
                <p className="text-xs text-ink-400 uppercase tracking-wider mb-1">{d.label}</p>
                <p className="font-semibold text-ink-900">{d.value || "—"}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-ink-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50">
                  <th className="text-left py-3 px-4 text-xs text-ink-500 uppercase tracking-wider font-medium">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-xs text-ink-500 uppercase tracking-wider font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i === rows.length - 1 ? "bg-ink-50 border-t border-ink-100" : "border-t border-ink-100"}
                  >
                    <td className={`py-3 px-4 ${row.tone === "strong" ? "font-bold text-ink-900" : "text-ink-700"}`}>
                      {row.label}
                    </td>
                    <td
                      className={`text-right py-3 px-4 ${
                        row.tone === "danger"
                          ? "text-rose-600 font-medium"
                          : row.tone === "strong"
                          ? "font-bold text-ink-900 text-lg"
                          : "text-ink-900 font-medium"
                      }`}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8 print:hidden">
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print Payslip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintPayslip
