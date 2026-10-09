import { useState } from 'react'
import Modal from '../components/Modal'
import { formatDuration, formatTime, matchesQuery } from '../utils'

export default function FindModal({ sessions, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const results = sessions.filter((s) => matchesQuery(s, query))

  return (
    <Modal onClose={onClose} width={400}>
      <div className="modal-head">
        <h3>Find vehicle</h3>
        <input
          className="search mono"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && onPick(results[0])}
          placeholder="Plate, slot or ticket no."
          autoFocus
        />
      </div>
      <div className="modal-list">
        {results.map((s) => (
          <button key={s.ticketNumber} type="button" className="list-row" onClick={() => onPick(s)}>
            <span className={`slot-chip ${s.overstay ? 'amber' : ''}`}>{s.slotNumber}</span>
            <span className="grow">
              <span className="block">{s.plate}</span>
              <span className="mono muted tiny">
                {s.ticketNumber} · in {formatTime(s.entry)}
              </span>
            </span>
            <span className="mono small">{formatDuration(s.minutes)}</span>
          </button>
        ))}
        {results.length === 0 && <div className="empty">No matching vehicle.</div>}
      </div>
      <div className="modal-foot">
        <span className="muted tiny">
          {results.length} of {sessions.length} sessions
        </span>
        <button type="button" className="btn ghost sm" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
