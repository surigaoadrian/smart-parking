import { useState } from 'react'
import Modal from '../components/Modal'

const REASONS = ['Wrong plate entered', 'Duplicate ticket', 'Vehicle turned away', 'Attendant error']

export default function VoidModal({ session, isAdmin, voidWindowMinutes, onClose, onConfirm }) {
  // Attendants may only void right after issuing (a mistake at the gate); older tickets need an admin.
  const tooOld = !isAdmin && session.minutes > voidWindowMinutes
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm(session, reason)
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
          <h3>Void this ticket?</h3>
          <p className="muted small">
            The slot is released, no fee is charged, and the void is recorded under your name.
          </p>
        </div>
      </div>
      <div className="modal-body divided">
        <div className="kv">
          <div>
            <span>Ticket</span>
            <span className="mono strong">{session.ticketNumber}</span>
          </div>
          <div>
            <span>Plate</span>
            <span className="mono">{session.plate}</span>
          </div>
          <div>
            <span>Slot to release</span>
            <span className="mono">{session.slotNumber}</span>
          </div>
        </div>
      </div>
      <div className="modal-body">
        <div className="eyebrow">Reason (required)</div>
        <div className="reason-grid">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip block ${reason === r ? 'active' : ''}`}
              onClick={() => setReason(r)}
            >
              {r}
            </button>
          ))}
        </div>
        {tooOld && (
          <div className="alert warn">
            This ticket is older than {voidWindowMinutes} minutes. Only an admin can void it.
          </div>
        )}
        {error && <div className="alert error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn ghost grow" onClick={onClose}>
            Keep ticket
          </button>
          <button type="button" className="btn danger grow" disabled={!reason || busy || tooOld} onClick={confirm}>
            {busy ? 'Voiding…' : 'Void & release slot'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
