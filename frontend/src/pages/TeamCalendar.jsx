import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, LogOut, RefreshCw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const TeamCalendar = () => {
  const navigate = useNavigate()
  const [month, setMonth] = useState(getCurrentMonth())
  const [calendarData, setCalendarData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const token = localStorage.getItem('token')

  const userRole = localStorage.getItem('role') || 'EMPLOYEE'

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const days = useMemo(() => buildMonthDays(month, calendarData), [calendarData, month])

  const loadCalendar = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await API.get('/calendar/', {
        ...authConfig,
        params: { month },
      })
      setCalendarData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load team calendar')
    } finally {
      setIsLoading(false)
    }
  }, [authConfig, month])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const timerId = window.setTimeout(() => {
      loadCalendar()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadCalendar, navigate, token])

  const moveMonth = (offset) => {
    const [year, monthNumber] = month.split('-').map(Number)
    const date = new Date(year, monthNumber - 1 + offset, 1)
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Team Leave Management</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Team Calendar</h1>
            <p className="mt-1 text-slate-500">Approved leave days for the selected month.</p>
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

        <nav className="flex flex-wrap gap-2">
          <Link to="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white">Employee</Link>
          <Link to="/manager-dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white">Manager</Link>
          <Link to="/hr-dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white">HR Admin</Link>
          <Link to="/team-calendar" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Calendar</Link>
        </nav>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">{formatMonthLabel(month)}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => moveMonth(-1)} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button type="button" onClick={() => moveMonth(1)} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-600">
              <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-blue-500" />
              Loading calendar...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-7">
              {days.map((day) => (
                <article key={day.date} className={`min-h-32 bg-white p-3 ${day.isWeekend ? 'bg-slate-50' : ''}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-slate-900">{day.day}</span>
                    <span className="text-xs font-medium text-slate-400">{day.weekday}</span>
                  </div>
                  <div className="space-y-2">
                    {day.leaves.length > 0 ? day.leaves.map((leave) => (
                      <div key={`${day.date}-${leave.application_id}`} className="rounded-lg bg-blue-50 px-2 py-1.5 text-xs text-blue-800">
                        <p className="font-bold">{leave.employee_name}</p>
                        <p>{leave.leave_type}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-300">No leave</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

const getCurrentMonth = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const buildMonthDays = (month, data) => {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1
    const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const jsDate = new Date(year, monthNumber - 1, day)

    return {
      date,
      day,
      weekday: jsDate.toLocaleDateString('en-IN', { weekday: 'short' }),
      isWeekend: jsDate.getDay() === 0 || jsDate.getDay() === 6,
      leaves: data[date] || [],
    }
  })
}

const formatMonthLabel = (month) => {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export default TeamCalendar
