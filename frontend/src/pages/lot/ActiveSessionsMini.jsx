import { formatDuration, peso } from '../../utils'

const LIMIT = 6

export default function ActiveSessionsMini({ sessions, selectedTicket, onPick, onViewAll }) {
  return (
    <section>
      <div className="section-head">
        <h2>Active sessions</h2>
        <button type="button" className="link" onClick={onViewAll}>
          View all →
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Plate</th>
              <th>Ticket</th>
              <th>Duration</th>
              <th className="right">Fee</th>
            </tr>
          </thead>
          <tbody>
            {sessions.slice(0, LIMIT).map((s) => (
              <tr
                key={s.ticketNumber}
                className={`clickable ${selectedTicket === s.ticketNumber ? 'selected' : ''}`}
                onClick={() => onPick(s)}
              >
                <td className={`mono strong ${s.overstay ? 'warn' : 'brand'}`}>{s.slotNumber}</td>
                <td>{s.plate}</td>
                <td className="mono muted">{s.ticketNumber}</td>
                <td className="mono">{formatDuration(s.minutes)}</td>
                <td className="mono right">{peso(s.fee?.total)}</td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No vehicles parked.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
