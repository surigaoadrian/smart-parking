export const VEHICLE_OPTIONS = [
  { key: 'CAR', label: 'Car', vehicleType: 'CAR', slotType: 'STANDARD' },
  { key: 'MOTORCYCLE', label: 'Motorcycle', vehicleType: 'MOTORCYCLE', slotType: 'MOTORCYCLE' },
  { key: 'PWD', label: 'PWD', vehicleType: 'CAR', slotType: 'PWD' },
]

export const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash' },
  { key: 'GCASH', label: 'GCash' },
  { key: 'CARD', label: 'Card' },
]

export const VEHICLE_LABEL = { CAR: 'Car', MOTORCYCLE: 'Motorcycle' }
export const SLOT_TYPE_LABEL = { STANDARD: 'Standard', MOTORCYCLE: 'Motorcycle', PWD: 'PWD' }
export const METHOD_LABEL = { CASH: 'Cash', GCASH: 'GCash', CARD: 'Card' }

// Jackson writes LocalDateTime without a zone, e.g. "2026-10-05T10:22:31.123456".
// Parse it explicitly as local time and trim the fraction to milliseconds.
export function parseDateTime(value) {
  if (!value) return null
  if (Array.isArray(value)) {
    const [y, mo, d, h = 0, mi = 0, s = 0, ns = 0] = value
    return new Date(y, mo - 1, d, h, mi, s, Math.floor(ns / 1e6))
  }
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/)
  if (!m) return new Date(value)
  const [, y, mo, d, h, mi, s = '0', frac = '0'] = m
  return new Date(+y, +mo - 1, +d, +h, +mi, +s, +frac.padEnd(3, '0').slice(0, 3))
}

export function minutesBetween(start, end) {
  return Math.max(0, Math.floor((end - start) / 60000))
}

export function isToday(date) {
  if (!date) return false
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export function formatDuration(minutes) {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

const pad = (n) => String(n).padStart(2, '0')

export function formatTime(date) {
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '—'
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "Nov 13, 2026" — shown on tickets and receipts so multi-day stays are clear.
export function formatDate(date) {
  return date ? `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}` : '—'
}

// "Nov 13, 2026 16:22"
export function formatDateTime(date) {
  return date ? `${formatDate(date)} ${formatTime(date)}` : '—'
}

export function formatClock(date) {
  return `${formatTime(date)}:${pad(date.getSeconds())}`
}

export function peso(amount) {
  const n = Number(amount)
  if (amount == null || Number.isNaN(n)) return '—'
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// "₱30" for whole amounts, "₱30.50" otherwise.
export function pesoShort(amount) {
  const n = Number(amount)
  if (amount == null || Number.isNaN(n)) return '—'
  return Number.isInteger(n) ? `₱${n}` : peso(n)
}

// Mirrors PaymentService.calculateFee: partial hours round up, minimum is the first hour.
export function feeBreakdown(minutes, lot) {
  if (!lot || lot.firstHourRate == null || lot.succeedingHourRate == null) return null
  const first = Number(lot.firstHourRate)
  const next = Number(lot.succeedingHourRate)
  const hours = Math.ceil(minutes / 60)
  const extraHours = Math.max(0, hours - 1)
  return { first, next, extraHours, extra: extraHours * next, total: first + extraHours * next }
}

export function toSession(ticket, now, lot) {
  const entry = parseDateTime(ticket.entryTime)
  const minutes = entry ? minutesBetween(entry, now) : 0
  const limitHours = lot?.overstayAfterHours
  return {
    ticket,
    ticketNumber: ticket.ticketNumber,
    plate: ticket.vehicle?.plateNumber ?? '—',
    vehicleType: ticket.vehicle?.vehicleType,
    slot: ticket.parkingSlot,
    slotNumber: ticket.parkingSlot?.slotNumber ?? '—',
    entry,
    minutes,
    fee: feeBreakdown(minutes, lot),
    overstay: limitHours != null && minutes > limitHours * 60,
  }
}

export function compareSlotNumbers(a = '', b = '') {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export function normalizePlate(value) {
  return value.toUpperCase().replace(/\s+/g, ' ').trim()
}

const squash = (value) => String(value ?? '').toUpperCase().replace(/[\s-]/g, '')

export function matchesQuery(session, query) {
  const q = squash(query)
  if (!q) return true
  return [session.plate, session.slotNumber, session.ticketNumber].some((v) => squash(v).includes(q))
}

export function slotRow(slotNumber = '') {
  return slotNumber.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() ?? '#'
}
