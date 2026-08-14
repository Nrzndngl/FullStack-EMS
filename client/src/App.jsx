import {Toaster} from 'react-hot-toast'
import {Routes, Route, Navigate} from 'react-router-dom'
import LoginLanding from './pages/LoginLanding'
import Layout from './pages/Layout'
import Attendance from './pages/Attendance'
import Employees from './pages/Employees'
import Leave from './pages/Leave'
import Payslips from './pages/Payslips'
import Setting from './pages/Setting'
import PrintPayslip from './pages/PrintPayslip'
import LoginForm from './components/LoginForm'
import Dashboard from './pages/Dashboard'


const App = () => {
  return (
    <>
    <Toaster />
    <Routes>
      <Route path='/login' element={<LoginLanding />} />

    <Route path='/login/admin' element={<LoginForm role="admin" title="Admin Portal" subtitle="Login to your admin account" />} />
      <Route path='/login/employee' element={<LoginForm role="employee" title="Employee Portal" subtitle="Login to your employee account" />} />

    
      <Route element = {<Layout />}>
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/attendance' element={<Attendance />} />
        <Route path='/employees' element={<Employees />} />
        <Route path='/leave' element={<Leave />} />
        <Route path='/payslips' element={<Payslips />} />
        <Route path='/setting' element={<Setting />} />
      </Route>
      <Route path='/print/payslips/:id' element={<PrintPayslip />} />

      <Route path='*' element={<Navigate to='/dashboard' replace /> } />

    </Routes>
    </>
  )
}

export default App