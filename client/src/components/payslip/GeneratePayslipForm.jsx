import { Plus } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

const GeneratePayslipForm = ({ employees, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries())
    try {
      await api.post('/payslips', data)
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      toast.error(error.response?.data?.error || error?.message);
    }
    setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" />
        Generate Payslip
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Generate Payslip"
        description="Create a payslip for an employee"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Employee</label>
            <select
              className="select"
              name="employeeId"
              required
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Select employee
              </option>
              {employees.map((e) => (
                <option key={e.id || e._id} value={e.id || e._id}>
                  {e.firstName} {e.lastName} ({e.position})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Month</label>
              <select className="select" name="month" defaultValue={new Date().getMonth() + 1}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Year</label>
              <input className="input" type="number" name="year" defaultValue={new Date().getFullYear()} required />
            </div>
          </div>

          <div>
            <label className="field-label">Basic Salary</label>
            <input className="input" type="number" name="basicSalary" required placeholder="5000" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Allowances</label>
              <input className="input" type="number" name="allowances" defaultValue="0" />
            </div>
            <div>
              <label className="field-label">Deductions</label>
              <input className="input" type="number" name="deductions" defaultValue="0" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default GeneratePayslipForm
