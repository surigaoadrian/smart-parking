import { IconMotorcycle, IconWheelchair } from '../../components/Icons'
import { formatDuration } from '../../utils'

function slotState(slot, session) {
  if (slot.status === 'OUT_OF_SERVICE') return 'closed'
  if (session?.overstay) return 'overstay'
  if (slot.status === 'OCCUPIED') return 'occupied'
  return 'free'
}

function slotCaption(slot, session) {
  if (slot.status === 'OUT_OF_SERVICE') return 'closed'
  if (session) return formatDuration(session.minutes)
  if (slot.status === 'OCCUPIED') return 'in use'
  return 'free'
}

// Special bay types get a badge so they stand out whether free or occupied.
const TYPE_BADGES = {
  MOTORCYCLE: { Icon: IconMotorcycle, label: 'Motorcycle slot', className: 'moto' },
  PWD: { Icon: IconWheelchair, label: 'PWD slot', className: 'pwd' },
}

function TypeBadge({ type }) {
  const badge = TYPE_BADGES[type]
  if (!badge) return null
  const { Icon, label, className } = badge
  return (
    <span className={`type-badge ${className}`} title={label} aria-label={label}>
      <Icon size={12} />
    </span>
  )
}

const LEGEND = ['free', 'occupied', 'overstay', 'closed', 'selected']

export default function SlotGrid({ slots, sessionsBySlotId, highlightedSlotId, onPick, onPickFree }) {
  return (
    <section>
      <div className="section-head">
        <h2>Parking slots</h2>
        <div className="legend">
          {LEGEND.map((key) => (
            <span key={key}>
              <i className={`swatch ${key}`} />
              {key}
            </span>
          ))}
          <span className="legend-divider" />
          <span>
            <TypeBadge type="MOTORCYCLE" />
            moto
          </span>
          <span>
            <TypeBadge type="PWD" />
            PWD
          </span>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="empty">No parking slots found on the server.</div>
      ) : (
        <div className="slot-grid">
          {slots.map((slot) => {
            const session = sessionsBySlotId.get(slot.id)
            const selected = slot.id === highlightedSlotId
            const free = slot.status === 'AVAILABLE'
            const clickable = Boolean(session) || free
            return (
              <button
                key={slot.id}
                type="button"
                className={`slot ${slotState(slot, session)} ${selected ? 'selected' : ''} ${clickable ? 'clickable' : ''}`}
                onClick={() => (session ? onPick(session) : free && onPickFree(slot))}
                title={session ? `${session.plate} · ${session.ticketNumber}` : free ? 'Assign this slot' : undefined}
              >
                <span className="slot-top">
                  <span className="slot-number">{slot.slotNumber}</span>
                  <TypeBadge type={slot.slotType} />
                </span>
                <span className="slot-sub">{slotCaption(slot, session)}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
