import { formatDuration, peso } from '../utils'

function Stat({ label, children, accent }) {
  return (
    <div className="stat">
      <div className="eyebrow">{label}</div>
      <div className={`stat-value ${accent ? 'accent' : ''}`}>{children}</div>
    </div>
  )
}

export default function StatsBar({ occupied, total, available, avgStayMinutes, revenueToday }) {
  return (
    <section className="stats">
      <Stat label="Occupied">
        {occupied}
        <small> / {total}</small>
      </Stat>
      <Stat label="Available" accent>
        {available}
      </Stat>
      <Stat label="Avg stay">{avgStayMinutes == null ? '—' : formatDuration(avgStayMinutes)}</Stat>
      <Stat label="Revenue today">{peso(revenueToday)}</Stat>
    </section>
  )
}
