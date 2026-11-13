import Modal from '../components/Modal'
import { METHOD_LABEL, formatDateTime, formatDuration, minutesBetween, parseDateTime, peso } from '../utils'

export default function ReceiptModal({ payment, session, onClose }) {
  const paidAt = parseDateTime(payment.paymentTime)
  const entry = parseDateTime(payment.ticket?.entryTime) ?? session?.entry
  const duration = entry && paidAt ? minutesBetween(entry, paidAt) : session?.minutes

  return (
    <Modal onClose={onClose} width={308} className="print-area">
      <div className="modal-head receipt-head">
        <span className="check">✓</span>
        <h3>Payment received</h3>
        <div className="receipt-amount">{peso(payment.amount)}</div>
        <div className="mono muted small">
          {payment.receiptNumber} · {METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod}
        </div>
      </div>
      <div className="modal-body">
        <div className="kv">
          <div>
            <span>Plate</span>
            <span className="mono strong">{payment.ticket?.vehicle?.plateNumber ?? session?.plate}</span>
          </div>
          <div>
            <span>Slot released</span>
            <span className="mono">{payment.ticket?.parkingSlot?.slotNumber ?? session?.slotNumber}</span>
          </div>
          <div>
            <span>Entry</span>
            <span className="mono">{formatDateTime(entry)}</span>
          </div>
          <div>
            <span>Duration</span>
            <span className="mono">{formatDuration(duration)}</span>
          </div>
          <div>
            <span>Paid at</span>
            <span className="mono">{formatDateTime(paidAt)}</span>
          </div>
        </div>
        <div className="modal-actions no-print">
          <button type="button" className="btn ghost grow" onClick={() => window.print()}>
            Print receipt
          </button>
          <button type="button" className="btn primary grow" onClick={onClose} autoFocus>
            Next vehicle
          </button>
        </div>
      </div>
    </Modal>
  )
}
