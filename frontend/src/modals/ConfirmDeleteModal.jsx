import { useState } from 'react'
import Modal from '../components/Modal'

export default function ConfirmDeleteModal({ member, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal onClose={onClose} width={340}>
      <div className="modal-head icon-head">
        <span className="icon-badge danger">!</span>
        <div>
          <h3>Delete this account?</h3>
          <p className="muted small">
            {member.fullName} (@{member.username}) will be removed permanently. This cannot be undone.
          </p>
        </div>
      </div>
      <div className="modal-body">
        {error && <div className="alert error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost grow" onClick={onClose}>
            Keep account
          </button>
          <button type="button" className="btn danger grow" disabled={busy} onClick={confirm}>
            {busy ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
