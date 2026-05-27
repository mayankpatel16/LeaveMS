import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const RegisterPage = () => {

  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Employee')
  const [managerName, setManagerName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await API.post('/auth/register', {
        username,
        email,
        password,
        role,
        manager_name: managerName || null,
      })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-100 px-4">
      <div className="w-full max-w-xl max-h-xl bg-white rounded-2xl shadow-md px-8 py-10">

        <h1 className="text-4xl font-bold text-gray-800 mb-1">Create an account</h1>
        <p className="text-md text-gray-600 mb-8">Sign up to get started</p>

          {/* Error message */}
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label htmlFor="name" className="block text-md font-bold text-gray-600 mb-1">
              Username
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-md font-bold text-gray-600 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-md font-bold text-gray-600 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-md font-bold text-gray-600 mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div>
            <label htmlFor="manager" className="block text-md font-bold text-gray-600 mb-1"> 
              Manager
              </label>
            <input
              id="manager"
              type="text"
              placeholder="e.g., John Doe"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full border border-gray-400 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg transition active:scale-[0.99]"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>

        </form>

        <p className="text-center text-lg text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-700 transition font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
};

export default RegisterPage;
