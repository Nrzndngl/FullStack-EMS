import {Toaster} from 'react-hot-toast'
import {Routes, Route, Navigate} from 'react-router-dom'
import LoginLanding from './pages/LoginLanding'
import Layout from './pages/Layout'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Leave from './pages/Leave'
import Payslips from './pages/Payslips'
import Setting from './pages/Setting'
import PrintPayslip from './pages/PrintPayslip'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuditLog from './pages/AuditLog'
import Announcements from './pages/Announcements'
import AnnouncementDetail from './pages/AnnouncementDetail'
import LoginForm from './components/LoginForm'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'


const RequireRole = ({ roles, children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  const role = user?.role || user?.role_type
  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const App = () => {
  return (
    <>
    <Toaster />
    <Routes>
      <Route path='/login' element={<LoginLanding />} />

    <Route path='/login/admin' element={<LoginForm role="admin" title="Admin Portal" subtitle="Login to your admin account" />} />
      <Route path='/login/employee' element={<LoginForm role="employee" title="Employee Portal" subtitle="Login to your employee account" />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/reset-password' element={<ResetPassword />} />

    
      <Route element = {<Layout />}>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/attendance' element={<Attendance />} />
        <Route path='/leave' element={<Leave />} />
        <Route path='/setting' element={<Setting />} />
        <Route path='/announcements' element={<Announcements />} />
        <Route path='/announcements/:id' element={<AnnouncementDetail />} />
        <Route path='/payslips' element={<Payslips />} />
        <Route path='/employees' element={<RequireRole roles={["ADMIN"]}><Employees /></RequireRole>} />
        <Route path='/employees/:id' element={<RequireRole roles={["ADMIN"]}><EmployeeDetail /></RequireRole>} />
        <Route path='/audit' element={<RequireRole roles={["ADMIN"]}><AuditLog /></RequireRole>} />
      </Route>
      <Route path='/print/payslips/:id' element={<PrintPayslip />} />

      <Route path='*' element={<Navigate to='/dashboard' replace /> } />

    </Routes>
    </>
  )
}

export default App