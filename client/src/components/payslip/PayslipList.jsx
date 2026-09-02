import { format } from "date-fns"
import { Download } from "lucide-react"
import EmptyState from "../ui/EmptyState"
import { formatNPR } from "../../utils/format"

const PayslipList = ({ payslips, isAdmin }) => {
  return (
    <div className="card overflow-hidden">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Period</th>
              <th>Basic Salary</th>
              <th>Net Salary</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="py-0">
                  <EmptyState title="No payslips found" description="Generated payslips will appear here." />
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => (
                <tr key={payslip._id || payslip.id}>
                  {isAdmin && (
                    <td className="text-ink-900 font-medium">
                      {(payslip.employee?.firstName || "") + " " + (payslip.employee?.lastName || "")}
                    </td>
                  )}
                  <td className="text-ink-600">
                    {format(new Date(payslip.year, payslip.month - 1), "MMMM yyyy")}
                  </td>
                  <td className="text-ink-600">{formatNPR(payslip.basicSalary)}</td>
                  <td className="text-ink-900 font-medium">{formatNPR(payslip.netSalary)}</td>
                  <td className="text-center">
                    <button
                      onClick={() => window.open(`/print/payslips/${payslip._id || payslip.id}`)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors ring-1 ring-primary-600/10"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PayslipList
