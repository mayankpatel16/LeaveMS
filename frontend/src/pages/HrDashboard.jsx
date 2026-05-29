import { useCallback, useEffect, useMemo, useState } from 'react'
import { LogOut, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const initialLeaveType = { name: '', DaysAllowed: 12, active: true, gender_allowed: 'All' }
const initialBalance = { user_id: '', leave_type_id: '', new_balance: '' }
const initialUser = { username: '', email: '', password: '', role: 'Employee', manager_name: '', gender: 'All' }

const HrDashboard = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveTypeForm, setLeaveTypeForm] = useState(initialLeaveType)
  const [balanceForm, setBalanceForm] = useState(initialBalance)
  const [userForm, setUserForm] = useState(initialUser)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const token = localStorage.getItem('token')

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` },
  }), [token])

  const employees = useMemo(() => users.filter((user) => user.role === 'Employee'), [users])
  const managers = useMemo(() => users.filter((user) => user.role === 'Manager'), [users])

  const selectedEmployee = useMemo(() => {
    if (!balanceForm.user_id) return null
    return employees.find(emp => String(emp.id) === String(balanceForm.user_id))
  }, [balanceForm.user_id, employees])

  const eligibleLeaveTypesForEmployee = useMemo(() => {
    if (!selectedEmployee) return leaveTypes
    return leaveTypes.filter(type => 
      type.gender_allowed === 'All' || 
      type.gender_allowed === selectedEmployee.gender
    )
  }, [selectedEmployee, leaveTypes])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [usersResponse, leaveTypesResponse] = await Promise.all([
        API.get('/auth/users', authConfig),
        API.get('/leave-types/', {
          ...authConfig,
          params: { include_inactive: true },
        }),
      ])

      setUsers(usersResponse.data)
      setLeaveTypes(leaveTypesResponse.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load HR dashboard')
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

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await API.post('/auth/register', {
        ...userForm,
        manager_name: userForm.role === 'Employee' ? userForm.manager_name || null : null,
        gender: userForm.gender,
      }, authConfig)
      setUserForm(initialUser)
      setSuccess(`${userForm.role} account created`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateLeaveType = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await API.post('/leave-types/', {
        ...leaveTypeForm,
        DaysAllowed: Number(leaveTypeForm.DaysAllowed),
        gender_allowed: leaveTypeForm.gender_allowed,
      }, authConfig)
      setLeaveTypeForm(initialLeaveType)
      setSuccess('Leave type created')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create leave type')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLeaveType = async (leaveType) => {
    setError('')
    setSuccess('')

    try {
      await API.put(`/leave-types/${leaveType.id}/active`, null, {
        ...authConfig,
        params: { active: !leaveType.active },
      })
      setSuccess(`Leave type ${leaveType.active ? 'deactivated' : 'activated'}`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update leave type')
    }
  }

  const handleAdjustBalance = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await API.put(`/balances/${balanceForm.user_id}`, null, {
        ...authConfig,
        params: {
          leave_type_id: Number(balanceForm.leave_type_id),
          new_balance: Number(balanceForm.new_balance),
        },
      })
      setBalanceForm(initialBalance)
      setSuccess('Employee balance updated')
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update balance')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-500" />
          <p className="font-medium text-slate-700">Loading HR dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Administration</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">HR Dashboard</h1>
            <p className="mt-1 text-slate-500">Manage users, leave balances, and leave types.</p>
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
          <Link to="/hr-dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">HR Admin</Link>
          <Link to="/team-calendar" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white">Team Calendar</Link>
        </nav>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</div>}

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <form onSubmit={handleCreateUser} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Create User</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="user_name" className="mb-1 block text-sm font-bold text-slate-700">Name</label>
                  <input
                    id="user_name"
                    value={userForm.username}
                    onChange={(e) => setUserForm((current) => ({ ...current, username: e.target.value }))}
                    required
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="user_email" className="mb-1 block text-sm font-bold text-slate-700">Email</label>
                  <input
                    id="user_email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((current) => ({ ...current, email: e.target.value }))}
                    required
                    placeholder="employee@example.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="user_password" className="mb-1 block text-sm font-bold text-slate-700">Password</label>
                  <input
                    id="user_password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((current) => ({ ...current, password: e.target.value }))}
                    required
                    placeholder="Set a temporary password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="user_gender" className="mb-1 block text-sm font-bold text-slate-700">Gender</label>
                  <select
                    id="user_gender"
                    value={userForm.gender}
                    onChange={(e) => setUserForm((current) => ({ ...current, gender: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="user_role" className="mb-1 block text-sm font-bold text-slate-700">Role</label>
                  <select
                    id="user_role"
                    value={userForm.role}
                    onChange={(e) => setUserForm((current) => ({ ...current, role: e.target.value, manager_name: '' }))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                {userForm.role === 'Employee' && (
                  <div>
                    <label htmlFor="user_manager" className="mb-1 block text-sm font-bold text-slate-700">Manager</label>
                    <select
                      id="user_manager"
                      value={userForm.manager_name}
                      onChange={(e) => setUserForm((current) => ({ ...current, manager_name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">No manager selected</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.username}>{manager.username}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300">
                  Create Account
                </button>
              </div>
            </form>

            <form onSubmit={handleAdjustBalance} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Adjust Balance</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="user_id" className="mb-1 block text-sm font-bold text-slate-700">Employee</label>
                  <select
                    id="user_id"
                    value={balanceForm.user_id}
                    onChange={(e) => setBalanceForm((current) => ({ ...current, user_id: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select employee</option>
                    {employees.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="balance_leave_type" className="mb-1 block text-sm font-bold text-slate-700">Leave Type</label>
                  <select
                    id="balance_leave_type"
                    value={balanceForm.leave_type_id}
                    onChange={(e) => setBalanceForm((current) => ({ ...current, leave_type_id: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select leave type</option>
                    {eligibleLeaveTypesForEmployee.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="new_balance" className="mb-1 block text-sm font-bold text-slate-700">New Balance</label>
                  <input
                    id="new_balance"
                    type="number"
                    min="0"
                    value={balanceForm.new_balance}
                    onChange={(e) => setBalanceForm((current) => ({ ...current, new_balance: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300">
                  Update Balance
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-900">Users</h2>
              </div>
              <div className="p-5">
                <div className="overflow:auto max-h-80 overflow-y-auto">
                  <table className="w-full min-w-640px text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Gender</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold">Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">{user.username}</td>
                          <td className="px-4 py-3 text-slate-600">{user.email}</td>
                          <td className="px-4 py-3 text-slate-600">{user.gender}</td>
                          <td className="px-4 py-3 text-slate-600">{user.role}</td>
                          <td className="px-4 py-3 text-slate-600">{user.manager_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <form onSubmit={handleCreateLeaveType} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">Create Leave Type</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="leave_type_name" className="mb-1 block text-sm font-bold text-slate-700">Name</label>
                  <input
                    id="leave_type_name"
                    value={leaveTypeForm.name}
                    onChange={(e) => setLeaveTypeForm((current) => ({ ...current, name: e.target.value }))}
                    required
                    placeholder="Sick Leave"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="days_allowed" className="mb-1 block text-sm font-bold text-slate-700">Days Allowed</label>
                  <input
                    id="days_allowed"
                    type="number"
                    min="0"
                    value={leaveTypeForm.DaysAllowed}
                    onChange={(e) => setLeaveTypeForm((current) => ({ ...current, DaysAllowed: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="gender_allowed" className="mb-1 block text-sm font-bold text-slate-700">Gender</label>
                  <select
                    id="gender_allowed"
                    value={leaveTypeForm.gender_allowed}
                    onChange={(e) => setLeaveTypeForm((current) => ({ ...current, gender_allowed: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={leaveTypeForm.active}
                    onChange={(e) => setLeaveTypeForm((current) => ({ ...current, active: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  Active
                </label>
                <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300">
                  Create Leave Type
                </button>
              </div>
            </form>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-xl font-bold text-slate-900">Leave Types</h2>
              </div>
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {leaveTypes.map((type) => (
                    <article key={type.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{type.name}</h3>
                          <p className="text-sm text-slate-500">{type.DaysAllowed} days allowed</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {type.gender_allowed ? `${type.gender_allowed}` : 'All genders'}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${type.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {type.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleLeaveType(type)}
                        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        {type.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </section>
      </div>
    </main>
  )
}

export default HrDashboard
