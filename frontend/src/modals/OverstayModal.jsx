import Modal from '../components/Modal'
import { formatDuration, peso } from '../utils'

export default function OverstayModal({ sessions, limitHours, onResolve, onClose }) {
  return (
    <Modal onClose={onClose} width={400}>
      <div className="modal-head icon-head">
        <span className="icon-badge warn">!</span>
        <div>
          <h3>Overstay alerts</h3>
          <p className="muted small">
            {limitHours != null ? `Past the ${limitHours}-hour maximum` : 'Overstay limit not configured'}
          </p>
        </div>
      </div>
      <div className="modal-list">
        {sessions.map((s) => (
          <div key={s.ticketNumber} className="list-row static">
            <span className="slot-chip amber">{s.slotNumber}</span>
            <span className="grow">
              <span className="block">{s.plate}</span>
              <span className="mono muted tiny">
                parked {formatDuration(s.minutes)} · fee {peso(s.fee?.total)}
              </span>
            </span>
            <button type="button" className="btn ghost sm" onClick={() => onResolve(s)}>
              Resolve
            </button>
          </div>
        ))}
        {sessions.length === 0 && <div className="empty">No vehicles past the limit.</div>}
      </div>
      <div className="modal-foot end">
        <button type="button" className="btn primary sm" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}
