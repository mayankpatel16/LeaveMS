import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, FileText, LogOut, Plus, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const initialForm = {
  leave_type_id: '',
  start_date: '',
  end_date: '',
  reason: '',
}

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))
    return JSON.parse(jsonPayload)
  } catch (err) {
    return null
  }
}

const EmployeeDashboard = () => {
  const navigate = useNavigate()
  const [balances, setBalances] = useState([])
  const [applications, setApplications] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const token = localStorage.getItem('token')

  const authConfig = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token])

  const userRole = useMemo(() => {
    if (!token) return null
    const decoded = decodeToken(token)
    return decoded?.role
  }, [token])

  const leaveTypeById = useMemo(() => {
    return leaveTypes.reduce((acc, type) => {
      acc[type.id] = type
      return acc
    }, {})
  }, [leaveTypes])

  const stats = useMemo(() => {
    const totalBalance = balances.reduce((sum, item) => sum + Number(item.balance || 0), 0)
    const pendingCount = applications.filter((item) => normalizeStatus(item.status) === 'pending').length
    const approvedCount = applications.filter((item) => normalizeStatus(item.status) === 'approved').length

    return { totalBalance, pendingCount, approvedCount }
  }, [applications, balances])

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') {
      return applications
    }
    return applications.filter((app) => normalizeStatus(app.status) === statusFilter)
  }, [applications, statusFilter])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [balancesResponse, applicationsResponse, leaveTypesResponse] = await Promise.all([
        API.get('/balances/me', authConfig),
        API.get('/applications/', authConfig),
        API.get('/leave-types/', authConfig),
      ])

      setBalances(balancesResponse.data)
      setApplications(applicationsResponse.data)
      setLeaveTypes(leaveTypesResponse.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [authConfig])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    if (userRole !== 'Employee') {
      setIsUnauthorized(true)
      setIsLoading(false)
      return
    }

    const timerId = window.setTimeout(() => {
      loadDashboard()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadDashboard, navigate, token, userRole])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await API.post('/applications/', {
        ...formData,
        leave_type_id: Number(formData.leave_type_id),
      }, authConfig)

      setFormData(initialForm)
      setSuccess('Leave application submitted successfully')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to submit leave application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    setError('')
    setSuccess('')

    try {
      await API.put(`/applications/${id}/cancel`, null, authConfig)
      setSuccess('Leave application cancelled')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to cancel application')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (isUnauthorized) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-red-700">Access Denied</h2>
            <p className="mt-2 text-red-600">This page is only accessible to employees. Please contact your administrator if you believe this is an error.</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
            <p className="font-medium text-slate-700">Loading your leave dashboard...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Leave Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Employee Dashboard</h1>
            <p className="mt-1 text-slate-500">Check balances, apply for leave, and track application status.</p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Employee</Link>
          <Link to="/team-calendar" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white">Team Calendar</Link>
        </nav>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Leave Days</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{stats.totalBalance}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{stats.pendingCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600"><Clock3 className="h-5 w-5" /></div>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Approved Requests</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{stats.approvedCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600"><FileText className="h-5 w-5" /></div>
            </div>
          </article>
        </section>

        {/* No need to show the this section. */}
        {/* <section>
          <h2 className="mb-3 text-xl font-bold text-slate-900">Leave Balances</h2>
          {balances.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {balances.map((balance) => {
                const leaveType = leaveTypeById[balance.leave_type_id]
                const allowedDays = leaveType?.DaysAllowed || 0
                const usedDays = Math.max(allowedDays - balance.balance, 0)
                const percentage = allowedDays ? Math.min((balance.balance / allowedDays) * 100, 100) : 0

                return (
                  <article key={balance.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{leaveType?.name || `Leave Type ${balance.leave_type_id}`}</h3>
                        <p className="mt-1 text-sm text-slate-500">Year {balance.current_year}</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                        <p className="text-2xl font-bold text-blue-600">{balance.balance}</p>
                        <p className="text-xs font-medium text-blue-500">left</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-sm text-slate-500">
                        <span>Used {usedDays}</span>
                        <span>Total {allowedDays || balance.balance}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${percentage || 100}%` }} />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
              No leave balances found for your account.
            </div>
          )}
        </section> */}

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Apply for Leave</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="leave_type_id" className="mb-1 block text-sm font-bold text-slate-700">Leave Type</label>
                <select
                  id="leave_type_id"
                  name="leave_type_id"
                  value={formData.leave_type_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="start_date" className="mb-1 block text-sm font-bold text-slate-700">Start Date</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="end_date" className="mb-1 block text-sm font-bold text-slate-700">End Date</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="reason" className="mb-1 block text-sm font-bold text-slate-700">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="4"
                  required
                  placeholder="Briefly explain your leave request"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>

          {/* filtering apllications by status to be added */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-bold text-slate-900">My Leave Applications</h2>
            </div>

            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    statusFilter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('approved')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    statusFilter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Approved
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('rejected')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    statusFilter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Rejected
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('cancelled')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    statusFilter === 'cancelled'
                      ? 'bg-slate-600 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>

            {filteredApplications.length > 0 ? (
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="w-full min-w-720px text-left">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Leave Type</th>
                      <th className="px-5 py-3 font-semibold">Dates</th>
                      <th className="px-5 py-3 font-semibold">Days</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Reason</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                      <th className="px-5 py-3 font-semibold">Reply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredApplications.map((application) => {
                      const status = normalizeStatus(application.status)
                      const canCancel = status === 'pending'

                      return (
                        <tr key={application.id} className="align-top transition hover:bg-slate-50">
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {leaveTypeById[application.leave_type_id]?.name || `Leave Type ${application.leave_type_id}`}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(application.start_date)} to {formatDate(application.end_date)}
                          </td>
                          <td className="px-5 py-4 text-slate-600">{application.working_days}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClass(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td className="max-w-220px px-5 py-4 text-slate-600">{application.reason}</td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={!canCancel}
                              onClick={() => handleCancel(application.id)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                            >
                              Cancel
                            </button>
                          </td>
                          <td className="px-5 py-4 text-slate-600 max-w-200px">
                            {application.manager_comments || <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8">
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
                  No applications found for the selected status.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

const normalizeStatus = (status) => String(status || '').toLowerCase()

const getStatusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700'
    case 'rejected':
      return 'bg-red-100 text-red-700'
    case 'cancelled':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-yellow-100 text-yellow-700'
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default EmployeeDashboard
