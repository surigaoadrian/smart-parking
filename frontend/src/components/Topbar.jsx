import { formatClock } from '../utils'

export default function Topbar({ subtitle, overstayCount, online, now, onOverstay }) {
  const statusText = online == null ? 'connecting…' : online ? 'server online' : 'server offline'

  return (
    <header className="topbar">
      <div className="brand">
        <h1>Smart Parking</h1>
        <span className="eyebrow">{subtitle}</span>
      </div>
      <div className="topbar-right">
        <button
          type="button"
          className={`overstay-pill ${overstayCount ? '' : 'calm'}`}
          onClick={onOverstay}
        >
          <span className="dot" />
          {overstayCount} overstay
        </button>
        <span className={`status ${online === false ? 'offline' : ''}`}>
          <span className="dot" />
          {statusText}
        </span>
        <span className="clock">{formatClock(now)}</span>
      </div>
    </header>
  )
}
