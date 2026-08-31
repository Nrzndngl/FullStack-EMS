import { useState } from 'react'
import LoginLeftSide from "./LoginLeftSide"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, EyeOffIcon, EyeIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const LoginForm = ({ role, title, subtitle }) => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await login(email, password, role)
            navigate('/dashboard')
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <LoginLeftSide />
            <div className='flex-1 flex item-center justify-center p-6 sm:p-12 bg-white'>
                <div className="w-full max-w-md animate-fade-in">
                    <Link to='/login' className='inline-flex items-center gap-2 text-slate-00 hover:text-slate-700 text-sm mb-10 transition-colors'>
                        <ArrowLeftIcon size={16} /> Back to Portal Selection
                    </Link>

                    <div className="mb-8">
                        <h1 className='text-2xl sm:text-3xl font-medium text-zinc-800'>
                            {title}
                        </h1>
                        <p className='text-slate-500 mt-2 text-sm sm:text-base'>
                            {subtitle}
                        </p>
                    </div>
                    {error && (
                        <div className='mb-6 p-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3'>
                            <div className='w-1.5 h-1.5 mt-1.5 rounded-full bg-rose-700' />
                            {error}
                        </div>
                    )}
                    <form className='space-y-6' onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john.doe@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>

                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder=".........." />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                </button>

                            </div>

                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Sign In
                        </button>
                    </form>
                </div>

            </div>
        </div>
    )
}

export default LoginForm