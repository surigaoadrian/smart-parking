import { useState } from 'react'
import {
  PAYMENT_METHODS,
  VEHICLE_LABEL,
  formatDuration,
  formatTime,
  peso,
  pesoShort,
} from '../../utils'

export default function ExitPanel({ session, now, onBack, onPay, onVoid, onShowTicket }) {
  const [method, setMethod] = useState('CASH')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { fee } = session

  async function pay() {
    setBusy(true)
    setError('')
    try {
      await onPay(session, method)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel-stack">
      <div className="eyebrow">Exit · calculate fee</div>

      <div className="card exit-card">
        <div className="exit-head">
          <div>
            <div className="plate-lg">{session.plate}</div>
            <div className="mono muted small">
              {session.ticketNumber} · {VEHICLE_LABEL[session.vehicleType] ?? '—'}
            </div>
          </div>
          <span className="slot-pill">{session.slotNumber}</span>
        </div>
        <div className="kv">
          <div>
            <span>Entry</span>
            <span className="mono">{formatTime(session.entry)}</span>
          </div>
          <div>
            <span>Exit</span>
            <span className="mono">{formatTime(now)}</span>
          </div>
          <div>
            <span>Duration</span>
            <span className="mono">{formatDuration(session.minutes)}</span>
          </div>
        </div>
        <button type="button" className="link small" onClick={onShowTicket}>
          View ticket
        </button>
      </div>

      <div className="card">
        {fee ? (
          <>
            <div className="kv">
              <div>
                <span>First hour</span>
                <span className="mono">{peso(fee.first)}</span>
              </div>
              <div>
                <span>
                  {fee.extraHours} extra hr{fee.extraHours === 1 ? '' : 's'} × {pesoShort(fee.next)}
                </span>
                <span className="mono">{peso(fee.extra)}</span>
              </div>
            </div>
            <hr />
            <div className="total-row">
              <span>Total due</span>
              <span className="total">{peso(fee.total)}</span>
            </div>
          </>
        ) : (
          <div className="muted">Rates could not be loaded from the server.</div>
        )}
      </div>

      <div className="eyebrow">Payment method</div>
      <div className="segmented">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={method === m.key ? 'active' : ''}
            onClick={() => setMethod(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button type="button" className="void-link" onClick={onVoid}>
        Void this ticket — issued by mistake
      </button>

      {error && <div className="alert error">{error}</div>}

      <div className="actions">
        <button type="button" className="btn ghost" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn primary grow lg" onClick={pay} disabled={busy}>
          {busy ? 'Processing…' : 'Take payment & release'}
        </button>
      </div>
      <p className="hint">The final amount is computed by the server at payment time.</p>
    </div>
  )
}
