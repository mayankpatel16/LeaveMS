import { useEffect, useMemo, useState } from 'react'
import { LogOut, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const AdminPage = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await API.get('/auth/users', authConfig)
      setUsers(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const timerId = window.setTimeout(() => {
      loadUsers()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [token, navigate, authConfig])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="font-medium text-slate-700">Loading users...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Admin Page</h1>
            <p className="mt-1 text-slate-500">View all system users</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-bold text-slate-900">Users List</h2>
          </div>
          <div className="p-5">
            <div className="overflow-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-640px text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 font-semibold text-slate-800">{user.username}</td>
                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3 text-slate-600">{user.role}</td>
                        <td className="px-4 py-3 text-slate-600">{user.manager_name || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-500">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminPage
