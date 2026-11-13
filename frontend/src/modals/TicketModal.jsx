import Modal from '../components/Modal'
import Barcode from '../components/Barcode'
import { VEHICLE_LABEL, formatDateTime, pesoShort } from '../utils'

export default function TicketModal({ session, lot, onClose, onVoid }) {
  const canVoid = session.ticket?.status === 'ACTIVE'

  return (
    <Modal onClose={onClose} width={308} className="print-area">
      <div className="modal-head ticket-head">
        <div>
          <div className="eyebrow">Parking ticket</div>
          <div className="ticket-no">{session.ticketNumber}</div>
        </div>
        <div className="slot-badge-md">{session.slotNumber}</div>
      </div>
      <div className="modal-body">
        <div className="kv">
          <div>
            <span>Plate</span>
            <span className="mono strong">{session.plate}</span>
          </div>
          <div>
            <span>Vehicle</span>
            <span>{VEHICLE_LABEL[session.vehicleType] ?? '—'}</span>
          </div>
          <div>
            <span>Entry time</span>
            <span className="mono">{formatDateTime(session.entry)}</span>
          </div>
          <div>
            <span>Rate</span>
            <span className="mono">
              {lot ? `${pesoShort(lot.firstHourRate)} / ${pesoShort(lot.succeedingHourRate)} hr` : '—'}
            </span>
          </div>
        </div>
        <Barcode value={session.ticketNumber} />
        <div className="barcode-caption">{session.ticketNumber} · keep this ticket</div>
        <div className="modal-actions no-print">
          {canVoid && (
            <button type="button" className="btn danger-soft" onClick={onVoid}>
              Void
            </button>
          )}
          <button type="button" className="btn ghost grow" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn primary grow" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
    </Modal>
  )
}
