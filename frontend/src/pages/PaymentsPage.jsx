import { METHOD_LABEL, formatTime, isToday, parseDateTime, peso } from '../utils'

function SummaryCard({ label, value, sub }) {
  return (
    <div className="card summary">
      <div className="eyebrow">{label}</div>
      <div className="summary-value">{value}</div>
      <div className="muted small">{sub}</div>
    </div>
  )
}

const sum = (list) => list.reduce((total, p) => total + Number(p.amount ?? 0), 0)

export default function PaymentsPage({ payments, voids, source }) {
  const todays = payments
    .map((p) => ({ ...p, time: parseDateTime(p.paymentTime) }))
    .filter((p) => p.status === 'PAID' && isToday(p.time))
    .sort((a, b) => b.time - a.time)

  const cash = todays.filter((p) => p.paymentMethod === 'CASH')
  const digital = todays.filter((p) => p.paymentMethod !== 'CASH')
  const todaysVoids = voids.filter((v) => isToday(new Date(v.at)))
  const waived = todaysVoids.reduce((total, v) => total + Number(v.fee ?? 0), 0)

  return (
    <div className="page">
      <div className="summary-grid">
        <SummaryCard
          label="Collected today"
          value={peso(sum(todays))}
          sub={`${todays.length} transaction${todays.length === 1 ? '' : 's'}`}
        />
        <SummaryCard label="Cash drawer" value={peso(sum(cash))} sub="cash payments today" />
        <SummaryCard label="Digital" value={peso(sum(digital))} sub="GCash + card" />
        <SummaryCard
          label="Voided"
          value={peso(waived)}
          sub={`${todaysVoids.length} correction${todaysVoids.length === 1 ? '' : 's'}`}
        />
      </div>

      <h2 className="section-title">Today's transactions</h2>
      {source === 'local' && (
        <p className="note">
          Couldn't load payments from <code>GET /api/payments</code> — showing receipts taken on this
          console only. Restart the backend if you just updated it.
        </p>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Plate</th>
              <th>Slot</th>
              <th>Method</th>
              <th>Time</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {todays.map((p) => (
              <tr key={p.receiptNumber}>
                <td className="mono green">{p.receiptNumber}</td>
                <td>{p.ticket?.vehicle?.plateNumber ?? '—'}</td>
                <td className="mono">{p.ticket?.parkingSlot?.slotNumber ?? '—'}</td>
                <td>
                  <span className={`tag method-${p.paymentMethod?.toLowerCase()}`}>
                    {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                  </span>
                </td>
                <td className="mono muted">{formatTime(p.time)}</td>
                <td className="mono right strong">{peso(p.amount)}</td>
              </tr>
            ))}
            {todays.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No payments yet today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
