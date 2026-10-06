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
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries())
    const basic = Number(data.basicSalary) || 0;
    const allowances = Number(data.allowances) || 0;
    const deductions = Number(data.deductions) || 0;
    if (basic + allowances - deductions < 0) {
      toast.error("Net salary cannot be negative");
      return;
    }
    setLoading(true)
    try {
      await api.post('/payslips', data)
      toast.success("Payslip generated")
      setIsOpen(false)
      setSelectedEmployee("")
      onSuccess()
      form.reset()
    } catch (error) {
      toast.error(error.response?.data?.error || error?.message);
    } finally {
      setLoading(false)
    }
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
            <input className="input" type="number" name="basicSalary" min="0" required placeholder="5000" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Allowances</label>
              <input className="input" type="number" name="allowances" min="0" defaultValue="0" />
            </div>
            <div>
              <label className="field-label">Deductions</label>
              <input className="input" type="number" name="deductions" min="0" defaultValue="0" />
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
