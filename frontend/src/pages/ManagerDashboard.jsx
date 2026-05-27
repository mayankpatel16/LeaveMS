import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, LogOut, RefreshCw, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const ManagerDashboard = () => {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [comments, setComments] = useState({})
  const [processingId, setProcessingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem('token')

  const authConfig = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token])

  const leaveTypeById = useMemo(() => {
    return leaveTypes.reduce((acc, type) => {
      acc[type.id] = type
      return acc
    }, {})
  }, [leaveTypes])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [requestsResponse, leaveTypesResponse] = await Promise.all([
        API.get('/applications/', authConfig),
        API.get('/leave-types/', authConfig),
      ])

      setRequests(requestsResponse.data)
      setLeaveTypes(leaveTypesResponse.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load pending leave requests')
    } finally {
      setIsLoading(false)
    }
  }, [authConfig])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const timerId = window.setTimeout(() => {
      loadDashboard()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadDashboard, navigate, token])

  const handleApprove = async (id) => {
    setProcessingId(id)
    setError('')
    setSuccess('')

    try {
      await API.put(`/applications/${id}/approve`, null, authConfig)
      setSuccess('Leave request approved')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to approve leave request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    setProcessingId(id)
    setError('')
    setSuccess('')

    try {
      await API.put(`/applications/${id}/reject`, null, {
        ...authConfig,
        params: {
          comment: comments[id] || '',
        },
      })
      setComments((current) => ({ ...current, [id]: '' }))
      setSuccess('Leave request rejected')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to reject leave request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCommentChange = (id, value) => {
    setComments((current) => ({ ...current, [id]: value }))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
            <p className="font-medium text-slate-700">Loading pending requests...</p>
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
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Manager Review</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Manager Dashboard</h1>
            <p className="mt-1 text-slate-500">Review pending leave requests from your direct reports.</p>
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
          <Link to="/manager-dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Manager</Link>
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

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Leave Requests</h2>
              <p className="text-sm text-slate-500">{requests.length} request{requests.length === 1 ? '' : 's'} awaiting action</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm font-bold text-yellow-700">
              <Clock3 className="h-4 w-4" />
              Pending
            </div>
          </div>

          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-900px text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Leave Type</th>
                    <th className="px-5 py-3 font-semibold">Dates</th>
                    <th className="px-5 py-3 font-semibold">Days</th>
                    <th className="px-5 py-3 font-semibold">Reason</th>
                    <th className="px-5 py-3 font-semibold">Reject Comment</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {requests.map((request) => {
                    const isProcessing = processingId === request.id

                    return (
                      <tr key={request.id} className="align-top transition hover:bg-slate-50">
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {request.employee_name || `Employee #${request.employee_id}`}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {request.leave_type_name || leaveTypeById[request.leave_type_id]?.name || `Leave Type ${request.leave_type_id}`}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(request.start_date)} to {formatDate(request.end_date)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{request.working_days}</td>
                        <td className="max-w-220px px-5 py-4 text-slate-600">{request.reason}</td>
                        <td className="px-5 py-4">
                          <input
                            type="text"
                            value={comments[request.id] || ''}
                            onChange={(e) => handleCommentChange(request.id, e.target.value)}
                            placeholder="Optional note"
                            className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(request.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(request.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
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
                No pending leave requests right now.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default ManagerDashboard
