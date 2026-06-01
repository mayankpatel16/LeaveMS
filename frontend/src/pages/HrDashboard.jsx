import { useCallback, useEffect, useMemo, useState } from 'react'
import { LogOut, Plus, RefreshCw, ShieldCheck, Pencil, X, Save, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api/axios.js'

const initialLeaveType = { name: '', DaysAllowed: 12, active: true, gender_allowed: 'All' }
const initialBalance = { user_id: '', leave_type_id: '', new_balance: '' }
const initialUser = { username: '', email: '', password: '', role: 'Employee', manager_name: '', gender: 'Male' }

/* ─── Reusable Modal Wrapper ─── */
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={{ animation: 'fadeSlideIn 0.18s ease' }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ─── Field Row helper ─── */
function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

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

  /* ── Edit modals ── */
  const [editingUser, setEditingUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({})
  const [editingLeaveType, setEditingLeaveType] = useState(null)
  const [editLeaveTypeForm, setEditLeaveTypeForm] = useState({})

  /* ── Manage Balances panel ── */
  const [balanceUserId, setBalanceUserId] = useState('')          // selected employee id
  const [userBalances, setUserBalances] = useState([])            // fetched balance rows
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [editingBalance, setEditingBalance] = useState(null)      // {id, leave_type_id, leave_type_name, balance}
  const [editBalanceValue, setEditBalanceValue] = useState('')
  const [addBalanceForm, setAddBalanceForm] = useState({ leave_type_id: '', new_balance: '' })

  const token = localStorage.getItem('token')
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  const employees = useMemo(() => users.filter((u) => u.role === 'Employee'), [users])
  const managers = useMemo(() => users.filter((u) => u.role === 'Manager'), [users])

  /* leave types already assigned to the selected balance-employee (by id) */
  const assignedLeaveTypeIds = useMemo(
    () => new Set(userBalances.map((b) => String(b.leave_type_id))),
    [userBalances]
  )

  /* resolved employee object for the balance panel — must come BEFORE unassignedLeaveTypes */
  const selectedBalanceEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(balanceUserId)),
    [employees, balanceUserId]
  )

  /* leave types NOT yet assigned to this employee, filtered by gender eligibility */
  const unassignedLeaveTypes = useMemo(
    () =>
      leaveTypes.filter((lt) => {
        if (!lt.active) return false
        if (assignedLeaveTypeIds.has(String(lt.id))) return false
        // Gender filter: only show leave types the employee is eligible for
        if (selectedBalanceEmployee) {
          if (lt.gender_allowed !== 'All' && lt.gender_allowed !== selectedBalanceEmployee.gender)
            return false
        }
        return true
      }),
    [leaveTypes, assignedLeaveTypeIds, selectedBalanceEmployee]
  )

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [usersRes, leaveTypesRes] = await Promise.all([
        API.get('/auth/users', authConfig),
        API.get('/leave-types/', { ...authConfig, params: { include_inactive: true } }),
      ])
      setUsers(usersRes.data)
      setLeaveTypes(leaveTypesRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load HR dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [authConfig])

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    const id = window.setTimeout(() => loadDashboard(), 0)
    return () => window.clearTimeout(id)
  }, [loadDashboard, navigate, token])

  /* Auto-clear flash messages */
  useEffect(() => {
    if (!success && !error) return
    const id = window.setTimeout(() => { setSuccess(''); setError('') }, 4000)
    return () => window.clearTimeout(id)
  }, [success, error])

  /* ── Fetch a user's balances when the selector changes ── */
  const loadUserBalances = useCallback(async (uid) => {
    if (!uid) { setUserBalances([]); return }
    setBalancesLoading(true)
    try {
      const res = await API.get(`/balances/user/${uid}`, authConfig)
      setUserBalances(res.data)
    } catch {
      setUserBalances([])
    } finally {
      setBalancesLoading(false)
    }
  }, [authConfig])

  const handleBalanceUserChange = (uid) => {
    setBalanceUserId(uid)
    setEditingBalance(null)
    setAddBalanceForm({ leave_type_id: '', new_balance: '' })
    loadUserBalances(uid)
  }

  /* ── Save inline balance edit ── */
  const handleSaveBalance = async (balance) => {
    setIsSubmitting(true)
    setError(''); setSuccess('')
    try {
      await API.put(`/balances/${balanceUserId}`, null, {
        ...authConfig,
        params: { leave_type_id: balance.leave_type_id, new_balance: Number(editBalanceValue) },
      })
      setSuccess(`Balance updated for ${balance.leave_type_name}`)
      setEditingBalance(null)
      await loadUserBalances(balanceUserId)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update balance')
    } finally { setIsSubmitting(false) }
  }

  /* ── Assign new leave type to employee ── */
  const handleAddBalance = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(''); setSuccess('')
    try {
      await API.put(`/balances/${balanceUserId}`, null, {
        ...authConfig,
        params: {
          leave_type_id: Number(addBalanceForm.leave_type_id),
          new_balance: Number(addBalanceForm.new_balance),
        },
      })
      setSuccess('Leave type assigned successfully')
      setAddBalanceForm({ leave_type_id: '', new_balance: '' })
      await loadUserBalances(balanceUserId)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to assign leave type')
    } finally { setIsSubmitting(false) }
  }

  /* ── Create User ── */
  const handleCreateUser = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError(''); setSuccess('')
    try {
      await API.post('/auth/register', {
        ...userForm,
        manager_name: userForm.role === 'Employee' ? userForm.manager_name || null : null,
      }, authConfig)
      setUserForm(initialUser)
      setSuccess(`${userForm.role} account created`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create user')
    } finally { setIsSubmitting(false) }
  }

  /* ── Create Leave Type ── */
  const handleCreateLeaveType = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError(''); setSuccess('')
    try {
      await API.post('/leave-types/', {
        ...leaveTypeForm, DaysAllowed: Number(leaveTypeForm.DaysAllowed),
      }, authConfig)
      setLeaveTypeForm(initialLeaveType)
      setSuccess('Leave type created')
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create leave type')
    } finally { setIsSubmitting(false) }
  }

  /* ── Toggle Leave Type active ── */
  const handleToggleLeaveType = async (leaveType) => {
    setError(''); setSuccess('')
    try {
      await API.put(`/leave-types/${leaveType.id}/active`, null, {
        ...authConfig, params: { active: !leaveType.active },
      })
      setSuccess(`Leave type ${leaveType.active ? 'deactivated' : 'activated'}`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update leave type')
    }
  }

  /* ── Edit User ── */
  const openEditUser = (user) => {
    setEditingUser(user)
    setEditUserForm({ username: user.username, email: user.email, role: user.role, gender: user.gender, manager_name: user.manager_name || '', password: '' })
    setError(''); setSuccess('')
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError(''); setSuccess('')
    try {
      const payload = { ...editUserForm }
      if (!payload.password) delete payload.password
      if (payload.role !== 'Employee') payload.manager_name = null
      await API.put(`/auth/users/${editingUser.id}`, payload, authConfig)
      setSuccess('User updated successfully')
      setEditingUser(null)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update user')
    } finally { setIsSubmitting(false) }
  }

  /* ── Edit Leave Type ── */
  const openEditLeaveType = (lt) => {
    setEditingLeaveType(lt)
    setEditLeaveTypeForm({ name: lt.name, DaysAllowed: lt.DaysAllowed, active: lt.active, gender_allowed: lt.gender_allowed })
    setError(''); setSuccess('')
  }

  const handleUpdateLeaveType = async (e) => {
    e.preventDefault(); setIsSubmitting(true); setError(''); setSuccess('')
    try {
      await API.put(`/leave-types/${editingLeaveType.id}`, {
        ...editLeaveTypeForm, DaysAllowed: Number(editLeaveTypeForm.DaysAllowed),
      }, authConfig)
      setSuccess('Leave type updated successfully')
      setEditingLeaveType(null)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update leave type')
    } finally { setIsSubmitting(false) }
  }

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login') }

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
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ══════ EDIT USER MODAL ══════ */}
      {editingUser && (
        <Modal title={`Edit User — ${editingUser.username}`} onClose={() => setEditingUser(null)}>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <Field label="Name" htmlFor="eu_name">
              <input id="eu_name" value={editUserForm.username} onChange={(e) => setEditUserForm((f) => ({ ...f, username: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Email" htmlFor="eu_email">
              <input id="eu_email" type="email" value={editUserForm.email} onChange={(e) => setEditUserForm((f) => ({ ...f, email: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="New Password (leave blank to keep current)" htmlFor="eu_password">
              <input id="eu_password" type="password" value={editUserForm.password} onChange={(e) => setEditUserForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" className={inputCls} />
            </Field>
            <Field label="Gender" htmlFor="eu_gender">
              <select id="eu_gender" value={editUserForm.gender} onChange={(e) => setEditUserForm((f) => ({ ...f, gender: e.target.value }))} className={inputCls}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="Role" htmlFor="eu_role">
              <select id="eu_role" value={editUserForm.role} onChange={(e) => setEditUserForm((f) => ({ ...f, role: e.target.value, manager_name: '' }))} className={inputCls}>
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
              </select>
            </Field>
            {editUserForm.role === 'Employee' && (
              <Field label="Manager" htmlFor="eu_manager">
                <select id="eu_manager" value={editUserForm.manager_name} onChange={(e) => setEditUserForm((f) => ({ ...f, manager_name: e.target.value }))} className={inputCls}>
                  <option value="">No manager selected</option>
                  {managers.map((m) => <option key={m.id} value={m.username}>{m.username}</option>)}
                </select>
              </Field>
            )}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════ EDIT LEAVE TYPE MODAL ══════ */}
      {editingLeaveType && (
        <Modal title={`Edit Leave Type — ${editingLeaveType.name}`} onClose={() => setEditingLeaveType(null)}>
          <form onSubmit={handleUpdateLeaveType} className="space-y-4">
            <Field label="Name" htmlFor="elt_name">
              <input id="elt_name" value={editLeaveTypeForm.name} onChange={(e) => setEditLeaveTypeForm((f) => ({ ...f, name: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Days Allowed" htmlFor="elt_days">
              <input id="elt_days" type="number" min="0" value={editLeaveTypeForm.DaysAllowed} onChange={(e) => setEditLeaveTypeForm((f) => ({ ...f, DaysAllowed: e.target.value }))} required className={inputCls} />
            </Field>
            <Field label="Gender" htmlFor="elt_gender">
              <select id="elt_gender" value={editLeaveTypeForm.gender_allowed} onChange={(e) => setEditLeaveTypeForm((f) => ({ ...f, gender_allowed: e.target.value }))} className={inputCls}>
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={editLeaveTypeForm.active} onChange={(e) => setEditLeaveTypeForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
              Active
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditingLeaveType(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════ MAIN PAGE ══════ */}
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Administration</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">HR Dashboard</h1>
              <p className="mt-1 text-slate-500">Manage users, leave balances, and leave types.</p>
            </div>
            <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </header>

          {/* Nav */}
          <nav className="flex flex-wrap gap-2">
            <Link to="/hr-dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">HR Admin</Link>
            <Link to="/team-calendar" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white">Team Calendar</Link>
          </nav>

          {/* Flash messages */}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</div>}

          {/* ─────────────────────────────────────────── */}
          {/* MANAGE EMPLOYEE BALANCES  (full-width card) */}
          {/* ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-blue-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Employee Leave Balances</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select an employee to view, edit or assign leave balances for the current year.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Employee selector */}
              <div className="flex items-end gap-4">
                <div className="flex-1 max-w-xs">
                  <label htmlFor="balance_emp_select" className="mb-1 block text-sm font-semibold text-slate-700">Employee</label>
                  <select
                    id="balance_emp_select"
                    value={balanceUserId}
                    onChange={(e) => handleBalanceUserChange(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Select employee —</option>
                    {employees.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
                {balanceUserId && (
                  <span className="mb-0.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {selectedBalanceEmployee?.gender} · {selectedBalanceEmployee?.role}
                  </span>
                )}
              </div>

              {/* Balances table */}
              {balanceUserId && (
                <>
                  {balancesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Loading balances...
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Leave Type</th>
                            <th className="px-4 py-3 font-semibold text-center">Current Balance (days)</th>
                            <th className="px-4 py-3 font-semibold text-center">New Balance</th>
                            <th className="px-4 py-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userBalances.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                                No leave balances assigned yet. Use the form below to add one.
                              </td>
                            </tr>
                          ) : (
                            userBalances.map((bal) => {
                              const isEditing = editingBalance?.id === bal.id
                              return (
                                <tr key={bal.id} className={`transition ${isEditing ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                  <td className="px-4 py-3 font-semibold text-slate-800">{bal.leave_type_name}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                                      {bal.balance}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isEditing ? (
                                      <input
                                        id={`bal_edit_${bal.id}`}
                                        type="number"
                                        min="0"
                                        value={editBalanceValue}
                                        onChange={(e) => setEditBalanceValue(e.target.value)}
                                        autoFocus
                                        className="w-28 rounded-lg border border-blue-400 px-3 py-1.5 text-center text-sm font-bold outline-none ring-2 ring-blue-100"
                                      />
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {isEditing ? (
                                      <div className="inline-flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setEditingBalance(null)}
                                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isSubmitting || editBalanceValue === ''}
                                          onClick={() => handleSaveBalance(bal)}
                                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                        >
                                          <Save className="h-3.5 w-3.5" /> Save
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => { setEditingBalance(bal); setEditBalanceValue(String(bal.balance)) }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                      >
                                        <Pencil className="h-3.5 w-3.5" /> Edit
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Assign a new leave type to this employee */}
                  {unassignedLeaveTypes.length > 0 && (
                    <form onSubmit={handleAddBalance} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
                      <div className="flex items-center gap-2 w-full mb-1">
                        <Plus className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-bold text-slate-700">Assign New Leave Type</span>
                      </div>
                      <div className="flex-1 min-w-180px">
                        <label htmlFor="add_bal_type" className="mb-1 block text-xs font-semibold text-slate-600">Leave Type</label>
                        <select
                          id="add_bal_type"
                          value={addBalanceForm.leave_type_id}
                          onChange={(e) => setAddBalanceForm((f) => ({ ...f, leave_type_id: e.target.value }))}
                          required
                          className={inputCls}
                        >
                          <option value="">Select type</option>
                          {unassignedLeaveTypes.map((lt) => (
                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-36">
                        <label htmlFor="add_bal_days" className="mb-1 block text-xs font-semibold text-slate-600">Days</label>
                        <input
                          id="add_bal_days"
                          type="number"
                          min="0"
                          value={addBalanceForm.new_balance}
                          onChange={(e) => setAddBalanceForm((f) => ({ ...f, new_balance: e.target.value }))}
                          required
                          placeholder="e.g. 12"
                          className={inputCls}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        <ChevronRight className="h-4 w-4" /> Assign
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ── Two-column layout ── */}
          <section className="grid gap-6 lg:grid-cols-[380px_1fr]">

            {/* Left column */}
            <div className="space-y-6">

              {/* Create User */}
              <form onSubmit={handleCreateUser} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Create User</h2>
                </div>
                <div className="space-y-4">
                  <Field label="Name" htmlFor="user_name">
                    <input id="user_name" value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} required placeholder="John Doe" className={inputCls} />
                  </Field>
                  <Field label="Email" htmlFor="user_email">
                    <input id="user_email" type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} required placeholder="employee@example.com" className={inputCls} />
                  </Field>
                  <Field label="Password" htmlFor="user_password">
                    <input id="user_password" type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required placeholder="Set a temporary password" className={inputCls} />
                  </Field>
                  <Field label="Gender" htmlFor="user_gender">
                    <select id="user_gender" value={userForm.gender} onChange={(e) => setUserForm((f) => ({ ...f, gender: e.target.value }))} className={inputCls}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Field>
                  <Field label="Role" htmlFor="user_role">
                    <select id="user_role" value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value, manager_name: '' }))} required className={inputCls}>
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </Field>
                  {userForm.role === 'Employee' && (
                    <Field label="Manager" htmlFor="user_manager">
                      <select id="user_manager" value={userForm.manager_name} onChange={(e) => setUserForm((f) => ({ ...f, manager_name: e.target.value }))} className={inputCls}>
                        <option value="">No manager selected</option>
                        {managers.map((m) => <option key={m.id} value={m.username}>{m.username}</option>)}
                      </select>
                    </Field>
                  )}
                  <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    Create Account
                  </button>
                </div>
              </form>

              {/* Create Leave Type */}
              <form onSubmit={handleCreateLeaveType} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Create Leave Type</h2>
                </div>
                <div className="space-y-4">
                  <Field label="Name" htmlFor="leave_type_name">
                    <input id="leave_type_name" value={leaveTypeForm.name} onChange={(e) => setLeaveTypeForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Sick Leave" className={inputCls} />
                  </Field>
                  <Field label="Days Allowed" htmlFor="days_allowed">
                    <input id="days_allowed" type="number" min="0" value={leaveTypeForm.DaysAllowed} onChange={(e) => setLeaveTypeForm((f) => ({ ...f, DaysAllowed: e.target.value }))} required className={inputCls} />
                  </Field>
                  <Field label="Gender" htmlFor="gender_allowed">
                    <select id="gender_allowed" value={leaveTypeForm.gender_allowed} onChange={(e) => setLeaveTypeForm((f) => ({ ...f, gender_allowed: e.target.value }))} className={inputCls}>
                      <option value="All">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </Field>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={leaveTypeForm.active} onChange={(e) => setLeaveTypeForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-blue-600" />
                    Active
                  </label>
                  <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                    Create Leave Type
                  </button>
                </div>
              </form>
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Users table */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-xl font-bold text-slate-900">Users</h2>
                </div>
                <div className="p-5">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full min-w-640px text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Name</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Gender</th>
                          <th className="px-4 py-3 font-semibold">Role</th>
                          <th className="px-4 py-3 font-semibold">Manager</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                          <tr key={user.id} className="transition hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-800">{user.username}</td>
                            <td className="px-4 py-3 text-slate-600">{user.email}</td>
                            <td className="px-4 py-3 text-slate-600">{user.gender}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${user.role === 'HR' ? 'bg-purple-100 text-purple-700' : user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{user.manager_name || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <button type="button" onClick={() => openEditUser(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Leave Types grid */}
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-xl font-bold text-slate-900">Leave Types</h2>
                </div>
                <div className="p-5 overflow-y-auto max-h-80">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {leaveTypes.map((type) => (
                      <article key={type.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-900">{type.name}</h3>
                            <p className="text-sm text-slate-500">{type.DaysAllowed} days allowed</p>
                            <p className="mt-0.5 text-xs text-slate-400">{type.gender_allowed ?? 'All genders'}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${type.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {type.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button type="button" onClick={() => openEditLeaveType(type)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button type="button" onClick={() => handleToggleLeaveType(type)} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition ${type.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                            {type.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default HrDashboard
