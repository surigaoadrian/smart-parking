import { useMemo, useState } from 'react'
import { VEHICLE_OPTIONS, compareSlotNumbers } from '../../utils'
import SlotGrid from './SlotGrid'
import EntryPanel from './EntryPanel'
import ExitPanel from './ExitPanel'
import ActiveSessionsMini from './ActiveSessionsMini'

const CHOICE_FOR_SLOT_TYPE = { STANDARD: 'CAR', MOTORCYCLE: 'MOTORCYCLE', PWD: 'PWD' }

export default function LotPage({
  slots,
  sessions,
  lot,
  now,
  selectedSession,
  onSelect,
  onClearSelection,
  onIssue,
  onPay,
  onVoid,
  onShowTicket,
  onViewAll,
}) {
  const [choice, setChoice] = useState('CAR')
  const [pickedSlotId, setPickedSlotId] = useState(null)
  const option = VEHICLE_OPTIONS.find((o) => o.key === choice)

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => compareSlotNumbers(a.slotNumber, b.slotNumber)),
    [slots],
  )
  const sessionsBySlotId = useMemo(() => new Map(sessions.map((s) => [s.slot?.id, s])), [sessions])
  const activePlates = useMemo(() => new Map(sessions.map((s) => [s.plate, s.slotNumber])), [sessions])

  // ParkingSlotRepository.findFirstByStatusAndSlotType picks the lowest id.
  const previewSlot = useMemo(
    () =>
      slots
        .filter((s) => s.status === 'AVAILABLE' && s.slotType === option.slotType)
        .sort((a, b) => a.id - b.id)[0] ?? null,
    [slots, option],
  )

  // A manually picked slot stays assigned only while it is still free and fits the vehicle.
  const pickedSlot =
    slots.find(
      (s) => s.id === pickedSlotId && s.status === 'AVAILABLE' && s.slotType === option.slotType,
    ) ?? null
  const assignedSlot = pickedSlot ?? previewSlot

  const highlightedSlotId = selectedSession ? selectedSession.slot?.id : assignedSlot?.id

  function pickFreeSlot(slot) {
    if (selectedSession) onClearSelection()
    if (slot.id === pickedSlot?.id) {
      setPickedSlotId(null)
      return
    }
    setPickedSlotId(slot.id)
    if (slot.slotType !== option.slotType) setChoice(CHOICE_FOR_SLOT_TYPE[slot.slotType] ?? choice)
  }

  function changeChoice(key) {
    setChoice(key)
    const next = VEHICLE_OPTIONS.find((o) => o.key === key)
    if (pickedSlot && pickedSlot.slotType !== next.slotType) setPickedSlotId(null)
  }

  async function issue(request) {
    await onIssue({ ...request, slotNumber: pickedSlot?.slotNumber })
    setPickedSlotId(null)
  }

  return (
    <div className="lot-layout">
      <div className="lot-main">
        <SlotGrid
          slots={sortedSlots}
          sessionsBySlotId={sessionsBySlotId}
          highlightedSlotId={highlightedSlotId}
          onPick={onSelect}
          onPickFree={pickFreeSlot}
        />
        <ActiveSessionsMini
          sessions={sessions}
          selectedTicket={selectedSession?.ticketNumber}
          onPick={onSelect}
          onViewAll={onViewAll}
        />
      </div>
      <aside className="side-panel">
        {selectedSession ? (
          <ExitPanel
            key={selectedSession.ticketNumber}
            session={selectedSession}
            now={now}
            onBack={onClearSelection}
            onPay={onPay}
            onVoid={() => onVoid(selectedSession)}
            onShowTicket={() => onShowTicket(selectedSession)}
          />
        ) : (
          <EntryPanel
            lot={lot}
            choice={choice}
            onChoice={changeChoice}
            assignedSlot={assignedSlot}
            manuallyPicked={Boolean(pickedSlot)}
            onAutoPick={() => setPickedSlotId(null)}
            activePlates={activePlates}
            onIssue={issue}
          />
        )}
      </aside>
    </div>
  )
}
