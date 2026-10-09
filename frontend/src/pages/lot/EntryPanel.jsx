import { useState } from 'react'
import { SLOT_TYPE_LABEL, VEHICLE_OPTIONS, normalizePlate, pesoShort } from '../../utils'

export default function EntryPanel({
  lot,
  choice,
  onChoice,
  assignedSlot,
  manuallyPicked,
  onAutoPick,
  activePlates,
  onIssue,
}) {
  const [plate, setPlate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const option = VEHICLE_OPTIONS.find((o) => o.key === choice)
  const typeLabel = SLOT_TYPE_LABEL[option.slotType].toLowerCase()
  const plateNumber = normalizePlate(plate)
  const parkedIn = activePlates.get(plateNumber)
  const canIssue = plateNumber && assignedSlot && !parkedIn && !busy

  async function submit(e) {
    e.preventDefault()
    if (!canIssue) return
    setBusy(true)
    setError('')
    try {
      await onIssue({ plateNumber, vehicleType: option.vehicleType, slotType: option.slotType })
      setPlate('')
    } catch (err) {
      setError(
        err.message === 'Internal Server Error'
          ? `The server rejected the entry. Check that the ${typeLabel} slot is still free.`
          : err.message,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel-stack" onSubmit={submit}>
      <div className="eyebrow">Entry · assign slot</div>

      <div className="card">
        <div className="card-row">
          <span className="card-title">Vehicle at gate</span>
          <span className="tag-mono">manual entry</span>
        </div>
        <input
          className="plate-input"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="ABC 1234"
          maxLength={12}
          autoFocus
          aria-label="Plate number"
        />
        <div className="chips">
          {VEHICLE_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`chip ${choice === o.key ? 'active' : ''}`}
              onClick={() => onChoice(o.key)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <span className="card-title">Assigned slot</span>
        <div className="assigned">
          <div className={`slot-badge-lg ${assignedSlot ? '' : 'empty'}`}>
            {assignedSlot?.slotNumber ?? '—'}
          </div>
          <div>
            <div>
              {!assignedSlot
                ? `No free ${typeLabel} bay`
                : manuallyPicked
                  ? `Picked from the lot · ${typeLabel} bay`
                  : `Next free ${typeLabel} bay`}
            </div>
            {manuallyPicked ? (
              <button type="button" className="link underline" onClick={onAutoPick}>
                Auto-pick nearest
              </button>
            ) : (
              <div className="muted small">Or click a free slot on the left</div>
            )}
          </div>
        </div>
      </div>

      <div className="rate-line">
        <span>rate</span>
        <span>
          {lot
            ? `${pesoShort(lot.firstHourRate)} first hr · ${pesoShort(lot.succeedingHourRate)}/hr after`
            : '—'}
        </span>
      </div>

      {parkedIn && (
        <div className="alert warn">
          {plateNumber} is already parked in {parkedIn}.
        </div>
      )}
      {error && <div className="alert error">{error}</div>}

      <button type="submit" className="btn primary block lg" disabled={!canIssue}>
        {busy ? 'Issuing…' : 'Issue ticket & open gate'}
      </button>
      {!plateNumber && <p className="hint">Enter the plate number to issue a ticket.</p>}
    </form>
  )
}
