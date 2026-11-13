import { useMemo, useState } from 'react'
import { compareSlotNumbers, slotRow } from '../utils'

const BRUSHES = [
  { key: 'STANDARD', label: 'Standard' },
  { key: 'MOTORCYCLE', label: 'Motorcycle' },
  { key: 'PWD', label: 'PWD' },
  { key: 'CLOSED', label: 'Closed' },
]
const DEFAULT_ROW_SIZE = 12
const MAX_SLOTS_PER_ROW = 99

const slotNumberOf = (row, n) => `${row}${String(n).padStart(2, '0')}`
const slotIndex = (slotNumber) => Number(slotNumber.match(/\d+$/)?.[0] ?? 0)
const sortLayout = (list) => [...list].sort((a, b) => compareSlotNumbers(a.slotNumber, b.slotNumber))

// The shape sent to PUT /api/parking-lots/{id}/slots.
function layoutFromSlots(slots) {
  return sortLayout(
    slots.map((s) => ({
      slotNumber: s.slotNumber,
      slotType: s.slotType,
      closed: s.status === 'OUT_OF_SERVICE',
    })),
  )
}

function groupRows(layout) {
  const rows = new Map()
  for (const slot of layout) {
    const row = slotRow(slot.slotNumber)
    if (!rows.has(row)) rows.set(row, [])
    rows.get(row).push(slot)
  }
  return [...rows.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function lotToForm(lot) {
  return {
    firstHourRate: String(lot?.firstHourRate ?? ''),
    succeedingHourRate: String(lot?.succeedingHourRate ?? ''),
    overstayAfterHours: String(lot?.overstayAfterHours ?? ''),
    voidWindowMinutes: String(lot?.voidWindowMinutes ?? 15),
  }
}

function validateRates(form) {
  const first = Number(form.firstHourRate)
  const next = Number(form.succeedingHourRate)
  const hours = Number(form.overstayAfterHours)
  if (form.firstHourRate === '' || Number.isNaN(first) || first < 0) return 'First hour rate must be 0 or more.'
  if (form.succeedingHourRate === '' || Number.isNaN(next) || next < 0)
    return 'Succeeding hour rate must be 0 or more.'
  if (!Number.isInteger(hours) || hours < 1) return 'Overstay limit must be a whole number of hours (1 or more).'
  const voidWindow = Number(form.voidWindowMinutes)
  if (form.voidWindowMinutes === '' || !Number.isInteger(voidWindow) || voidWindow < 0 || voidWindow > 1440)
    return 'Attendant void window must be 0 to 1440 minutes.'
  return ''
}

const chipClass = (slot) => (slot.closed ? 'closed' : slot.slotType.toLowerCase())

export default function SettingsPage({ lot, slots, onSave }) {
  const serverLayout = useMemo(() => layoutFromSlots(slots), [slots])
  const serverRates = lotToForm(lot)

  // null = no local edits; the page shows (and follows) the server values.
  const [layoutDraft, setLayoutDraft] = useState(null)
  const [ratesDraft, setRatesDraft] = useState(null)
  const [brush, setBrush] = useState('MOTORCYCLE')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const layout = layoutDraft ?? serverLayout
  const rates = ratesDraft ?? serverRates
  const layoutDirty = layoutDraft != null && JSON.stringify(layoutDraft) !== JSON.stringify(serverLayout)
  const ratesDirty = ratesDraft != null && JSON.stringify(ratesDraft) !== JSON.stringify(serverRates)
  const dirty = layoutDirty || ratesDirty

  const occupied = useMemo(
    () => new Set(slots.filter((s) => s.status === 'OCCUPIED').map((s) => s.slotNumber)),
    [slots],
  )
  const rows = groupRows(layout)
  const lastRow = rows[rows.length - 1]
  const canAddRow = !lastRow || (lastRow[0].length === 1 && lastRow[0] < 'Z')

  const counts = {
    Standard: layout.filter((s) => !s.closed && s.slotType === 'STANDARD').length,
    Motorcycle: layout.filter((s) => !s.closed && s.slotType === 'MOTORCYCLE').length,
    PWD: layout.filter((s) => !s.closed && s.slotType === 'PWD').length,
    Closed: layout.filter((s) => s.closed).length,
  }

  function editLayout(change) {
    setError('')
    setLayoutDraft(sortLayout(change(layout)))
  }

  function addSlot(row, list) {
    const next = Math.max(0, ...list.map((s) => slotIndex(s.slotNumber))) + 1
    editLayout((l) => [...l, { slotNumber: slotNumberOf(row, next), slotType: 'STANDARD', closed: false }])
  }

  function removeLastSlot(list) {
    const last = list[list.length - 1]
    editLayout((l) => l.filter((s) => s.slotNumber !== last.slotNumber))
  }

  function removeRow(row) {
    editLayout((l) => l.filter((s) => slotRow(s.slotNumber) !== row))
  }

  function addRow() {
    const letter = lastRow ? String.fromCharCode(lastRow[0].charCodeAt(0) + 1) : 'A'
    const size = lastRow?.[1].length ?? DEFAULT_ROW_SIZE
    const added = Array.from({ length: size }, (_, i) => ({
      slotNumber: slotNumberOf(letter, i + 1),
      slotType: 'STANDARD',
      closed: false,
    }))
    editLayout((l) => [...l, ...added])
  }

  function paint(slotNumber) {
    if (occupied.has(slotNumber)) return
    editLayout((l) =>
      l.map((s) => {
        if (s.slotNumber !== slotNumber) return s
        return brush === 'CLOSED' ? { ...s, closed: true } : { ...s, slotType: brush, closed: false }
      }),
    )
  }

  const setRate = (key) => (e) => setRatesDraft({ ...rates, [key]: e.target.value })

  function discard() {
    setLayoutDraft(null)
    setRatesDraft(null)
    setError('')
  }

  async function save() {
    const problem = ratesDirty ? validateRates(rates) : ''
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({
        layout: layoutDirty ? layout : null,
        lot: ratesDirty
          ? {
              ...lot,
              firstHourRate: Number(rates.firstHourRate),
              succeedingHourRate: Number(rates.succeedingHourRate),
              overstayAfterHours: Number(rates.overstayAfterHours),
              voidWindowMinutes: Number(rates.voidWindowMinutes),
            }
          : null,
      })
      setLayoutDraft(null)
      setRatesDraft(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page settings-layout">
      <div className="settings-main">
        <section className="card flush">
          <div className="card-head">
            <div>
              <h3>Slot layout</h3>
              <p className="muted small">Rows of bays and how many slots each row holds</p>
            </div>
            <span className="mono small">{layout.length} slots</span>
          </div>
          {rows.map(([row, list]) => {
            const last = list[list.length - 1]
            const rowOccupied = list.some((s) => occupied.has(s.slotNumber))
            return (
              <div className="layout-row" key={row}>
                <span className="row-badge">{row}</span>
                <span className="grow">Row {row}</span>
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => removeLastSlot(list)}
                    disabled={list.length <= 1 || occupied.has(last.slotNumber)}
                    title={occupied.has(last.slotNumber) ? `${last.slotNumber} is occupied` : undefined}
                    aria-label={`Remove a slot from row ${row}`}
                  >
                    −
                  </button>
                  <span className="mono">{list.length}</span>
                  <button
                    type="button"
                    onClick={() => addSlot(row, list)}
                    disabled={slotIndex(last.slotNumber) >= MAX_SLOTS_PER_ROW}
                    aria-label={`Add a slot to row ${row}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="btn sm danger-outline"
                  onClick={() => removeRow(row)}
                  disabled={rowOccupied || rows.length <= 1}
                  title={rowOccupied ? 'Row has occupied slots' : undefined}
                >
                  Remove
                </button>
              </div>
            )
          })}
          <div className="layout-add">
            <button type="button" className="add-row" onClick={addRow} disabled={!canAddRow}>
              + Add row
            </button>
          </div>
        </section>

        <section className="card flush">
          <div className="card-head">
            <div>
              <h3>Slot types</h3>
              <p className="muted small">Pick a type, then click slots to apply it</p>
            </div>
          </div>
          <div className="type-legend">
            {BRUSHES.map((b) => (
              <button
                key={b.key}
                type="button"
                className={`pill brush ${brush === b.key ? 'active' : ''}`}
                onClick={() => setBrush(b.key)}
              >
                <i className={`swatch type-${b.key.toLowerCase()}`} />
                {b.label}
              </button>
            ))}
          </div>
          <div className="type-grid">
            {rows.map(([row, list]) => (
              <div className="type-row" key={row}>
                <span className="muted small row-label">{row}</span>
                {list.map((slot) => {
                  const locked = occupied.has(slot.slotNumber)
                  return (
                    <button
                      key={slot.slotNumber}
                      type="button"
                      className={`type-chip type-${chipClass(slot)} ${locked ? 'locked' : ''}`}
                      onClick={() => paint(slot.slotNumber)}
                      disabled={locked}
                      title={locked ? 'Occupied — cannot be edited' : undefined}
                    >
                      {slot.slotNumber}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          <p className="note inset">
            Occupied slots are locked. Removed slots are retired rather than deleted, so their ticket
            history is kept.
          </p>
        </section>
      </div>

      <div className="settings-side">
        <section className="card">
          <h3>Rates &amp; rules</h3>
          {lot ? (
            <div className="form">
              <label>
                <span className="eyebrow">First hour</span>
                <span className="input-affix">
                  <i>₱</i>
                  <input inputMode="decimal" value={rates.firstHourRate} onChange={setRate('firstHourRate')} />
                  <em>flat</em>
                </span>
              </label>
              <label>
                <span className="eyebrow">Each succeeding hour</span>
                <span className="input-affix">
                  <i>₱</i>
                  <input
                    inputMode="decimal"
                    value={rates.succeedingHourRate}
                    onChange={setRate('succeedingHourRate')}
                  />
                  <em>/ hr</em>
                </span>
              </label>
              <label>
                <span className="eyebrow">Overstay after</span>
                <span className="input-affix">
                  <input
                    inputMode="numeric"
                    value={rates.overstayAfterHours}
                    onChange={setRate('overstayAfterHours')}
                  />
                  <em>hours</em>
                </span>
              </label>
              <label>
                <span className="eyebrow">Attendants can void within</span>
                <span className="input-affix">
                  <input
                    inputMode="numeric"
                    value={rates.voidWindowMinutes}
                    onChange={setRate('voidWindowMinutes')}
                  />
                  <em>min of issue</em>
                </span>
                <span className="hint left">Older tickets can only be voided by an admin.</span>
              </label>
            </div>
          ) : (
            <p className="muted small">Parking lot configuration could not be loaded from the server.</p>
          )}
        </section>

        <section className="card">
          <div className="kv">
            {Object.entries(counts).map(([label, n]) => (
              <div key={label}>
                <span>{label}</span>
                <span className="mono">{n}</span>
              </div>
            ))}
          </div>
        </section>

        {error && <div className="alert error">{error}</div>}

        <div className="actions">
          <button type="button" className="btn ghost" disabled={!dirty || busy} onClick={discard}>
            Discard
          </button>
          <button type="button" className="btn primary grow" disabled={!lot || !dirty || busy} onClick={save}>
            {busy ? 'Saving…' : 'Save configuration'}
          </button>
        </div>
        {dirty && <p className="hint">You have unsaved changes.</p>}
      </div>
    </div>
  )
}
