import { useState } from 'react'
import Modal from '../components/Modal'

// Used for both an admin resetting someone's password and staff changing their own
// (askCurrent = true adds a "current password" field).
export default function ResetPasswordModal({ title, description, askCurrent = false, onClose, onSubmit }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (askCurrent && !currentPassword) return setError('Enter your current password.')
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.')
    if (newPassword !== confirm) return setError('The two new passwords do not match.')
    setBusy(true)
    setError('')
    try {
      await onSubmit({ currentPassword, newPassword })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} width={360}>
      <form onSubmit={submit} noValidate>
        <div className="modal-head">
          <h3>{title}</h3>
          {description && <p className="muted small">{description}</p>}
        </div>
        <div className="modal-body">
          <div className="form tight">
            {askCurrent && (
              <label>
                <span className="eyebrow">Current password</span>
                <input
                  className="text-input"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>
            )}
            <label>
              <span className="eyebrow">New password</span>
              <input
                className="text-input"
                type="password"
                autoComplete="new-password"
                autoFocus={!askCurrent}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label>
              <span className="eyebrow">Confirm new password</span>
              <input
                className="text-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          </div>
          {error && <div className="alert error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn ghost grow" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary grow" disabled={busy}>
              {busy ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
