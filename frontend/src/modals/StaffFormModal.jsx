import { useState } from 'react'
import Modal from '../components/Modal'

const USERNAME_RULE = /^[A-Za-z0-9._-]{3,30}$/

export default function StaffFormModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ fullName: '', username: '', password: '', role: 'ATTENDANT' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    if (!form.fullName.trim()) return 'Full name is required.'
    if (!USERNAME_RULE.test(form.username.trim()))
      return 'Username must be 3-30 characters: letters, numbers, dot, dash or underscore.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    return ''
  }

  async function submit(e) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit({ ...form, fullName: form.fullName.trim(), username: form.username.trim() })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} width={380}>
      <form onSubmit={submit} noValidate>
        <div className="modal-head">
          <h3>Add staff account</h3>
          <p className="muted small">The new staff member signs in with this username and password.</p>
        </div>
        <div className="modal-body">
          <div className="form tight">
            <label>
              <span className="eyebrow">Full name</span>
              <input className="text-input" autoFocus value={form.fullName} onChange={set('fullName')} />
            </label>
            <label>
              <span className="eyebrow">Username</span>
              <input
                className="text-input mono"
                autoComplete="off"
                placeholder="e.g. juan.cruz"
                value={form.username}
                onChange={set('username')}
              />
            </label>
            <label>
              <span className="eyebrow">Temporary password</span>
              <input
                className="text-input"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set('password')}
              />
            </label>
            <div>
              <span className="eyebrow">Role</span>
              <div className="chip-row">
                {[
                  ['ATTENDANT', 'Attendant', 'Gate: entry, exit, payments'],
                  ['ADMIN', 'Admin', 'Everything, incl. settings & staff'],
                ].map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip block role-chip ${form.role === value ? 'active' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, role: value }))}
                  >
                    <span className="strong">{label}</span>
                    <span className="muted small">{hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="alert error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn ghost grow" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary grow" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
