import { useState } from 'react'
import { VEHICLE_LABEL, formatDuration, matchesQuery, peso } from '../utils'

const FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'overstay', label: 'Overstay', test: (s) => s.overstay },
  { key: 'moto', label: 'Motorcycle', test: (s) => s.vehicleType === 'MOTORCYCLE' },
]

export default function SessionsPage({ sessions, onVoid, onShowTicket, onCheckOut }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const { test } = FILTERS.find((f) => f.key === filter)
  const visible = sessions.filter((s) => test(s) && matchesQuery(s, query))

  return (
    <div className="page">
      <div className="toolbar">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plate, slot or ticket"
        />
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`pill ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
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
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.ticketNumber}>
                <td className={`mono strong ${s.overstay ? 'amber' : 'green'}`}>{s.slotNumber}</td>
                <td>
                  <span className="plate-cell">
                    {s.plate}
                    {s.overstay ? (
                      <span className="tag amber">overstay</span>
                    ) : (
                      <span className="tag">{VEHICLE_LABEL[s.vehicleType] ?? '—'}</span>
                    )}
                  </span>
                </td>
                <td className="mono muted">{s.ticketNumber}</td>
                <td className="mono">{formatDuration(s.minutes)}</td>
                <td className="mono right strong">{peso(s.fee?.total)}</td>
                <td className="right">
                  <div className="row-actions">
                    <button type="button" className="btn xs danger-outline" onClick={() => onVoid(s)}>
                      Void
                    </button>
                    <button type="button" className="btn xs ghost" onClick={() => onShowTicket(s)}>
                      Ticket
                    </button>
                    <button type="button" className="btn xs primary" onClick={() => onCheckOut(s)}>
                      Check out
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  {sessions.length ? 'No sessions match your search.' : 'No vehicles parked.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
