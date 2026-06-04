import { useState } from 'react'
import API from '../api/axios.js'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   setIsLoading(true)
  //   setError('')
  //   try {
  //     const response = await API.post('/auth/login', { email, password })
  //     localStorage.setItem('token', response.data.access_token)
  //     navigate(getDashboardPath(response.data.access_token))
  //   } catch (err) {
  //     console.error('Login error:', err)
  //     setError(err.response?.data?.detail || 'Invalid email or password')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-950">

      {/* Left panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-14 bg-neutral-800 overflow-hidden">

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-3xl font-bold uppercase text-stone-200">
            LeaveMS
          </span>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-500">
              Employee Portal
            </span>
          </div>
          <h2 className="text-5xl font-light leading-[1.1] text-stone-100 mb-6">
            Manage your<br />
            leaves with{' '}
            <span className="italic text-amber-200 font-normal">ease</span><br />
            and clarity.
          </h2>
          <p className="text-sm leading-relaxed max-w-sm text-amber-500">
            One place to request leave, track balances, and stay in sync
            with your team — without the back-and-forth.
          </p>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs tracking-wide text-neutral-700">
        </p>
      </div>

      {/* Right panel */}
      <div className="relative flex items-center justify-center px-6 py-16 bg-stone-50">

        {/* Top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-3px"
          style={{ background: 'linear-gradient(90deg, transparent, #d97706, transparent)' }}
        />

        <div className="w-full max-w-sm">

          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-10">
            Welcome !
          </h1>
          {/* <p className="text-4xl text-neutral-600 font-bold mb-10">
            Sign in to continue to your dashboard
          </p> */}

          {error && (
            <div className="mb-6 border-l-4 border-red-400 bg-red-50 px-4 py-3 text-xs text-red-600 rounded-r-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="email" className="block text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-neutral-200 border-b-2 border-b-neutral-300 rounded-t-lg rounded-b px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-amber-400 focus:border-b-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-neutral-200 border-b-2 border-b-neutral-300 rounded-t-lg rounded-b px-4 py-3 text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-amber-400 focus:border-b-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-stone-100 text-xs font-semibold tracking-[0.15em] uppercase rounded-lg py-3.5 mt-1 transition-colors duration-200 active:scale-[0.99]"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-stone-200 text-center text-xs leading-relaxed text-neutral-400">
            Employee and manager accounts are created by HR.
          </div>

        </div>
      </div>
    </div>
  )
}

const getDashboardPath = (token) => {
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1]))
    if (payload.role === 'Manager') return '/manager-dashboard'
    if (payload.role === 'HR') return '/hr-dashboard'
    return '/dashboard'
  } catch {
    return '/dashboard'
  }
}

export default LoginPage;