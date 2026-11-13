import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import {
  METHOD_LABEL,
  VEHICLE_LABEL,
  formatDate,
  formatDateTime,
  formatDuration,
  parseDateTime,
  peso,
} from '../utils'

// ---------- dates ----------

const pad = (n) => String(n).padStart(2, '0')
const toIsoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromIsoDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

function presetRange(key) {
  const today = new Date()
  switch (key) {
    case 'yesterday':
      return [addDays(today, -1), addDays(today, -1)]
    case 'week':
      return [addDays(today, -6), today]
    case 'month':
      return [new Date(today.getFullYear(), today.getMonth(), 1), today]
    case 'lastMonth':
      return [
        new Date(today.getFullYear(), today.getMonth() - 1, 1),
        new Date(today.getFullYear(), today.getMonth(), 0),
      ]
    default:
      return [today, today]
  }
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function rangeLabel(from, to) {
  const f = fromIsoDate(from)
  if (from === to) return `${WEEKDAYS[f.getDay()]}, ${formatDate(f)}`
  return `${formatDate(f)} – ${formatDate(fromIsoDate(to))}`
}

const hourLabel = (h) => (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`)

// ---------- CSV ----------

function csvCell(value) {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(filename, header, rows) {
  const text = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  // BOM so Excel opens names and symbols correctly.
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const isoDateTime = (value) => {
  const d = parseDateTime(value)
  return d ? `${toIsoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : ''
}

// Axis labels: ₱500, ₱2.5k, ₱20k
function pesoCompact(n) {
  if (n >= 1000) return `₱${Number((n / 1000).toFixed(1))}k`
  return `₱${Math.round(n)}`
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Rounds the chart's top line up to a readable number (100, 250, 500, 1,000 ...).
function niceMax(value) {
  if (value <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)
  return step * magnitude
}

// ---------- pieces ----------

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`rp-kpi ${tone ?? ''}`}>
      <div className="eyebrow">{label}</div>
      <div className="rp-kpi-value">{value}</div>
      <div className="rp-kpi-sub">{sub}</div>
    </div>
  )
}

// Revenue over time. One series, so the card title names it and there is no legend.
function RevenueChart({ buckets, title, caption }) {
  const [hover, setHover] = useState(null)
  const top = niceMax(Math.max(...buckets.map((b) => b.amount), 0))
  const labelEvery = buckets.length > 16 ? Math.ceil(buckets.length / 8) : buckets.length > 12 ? 2 : 1
  const total = buckets.reduce((sum, b) => sum + b.amount, 0)
  const count = buckets.reduce((sum, b) => sum + b.count, 0)
  // Shows the hovered bar, or the whole period when nothing is hovered.
  // The fallback also covers a stale hover index after switching to a range with fewer bars.
  const active = (hover != null && buckets[hover]) || { long: 'Total', amount: total, count }

  return (
    <section className="rp-card rp-chart-card">
      <header className="rp-card-head">
        <div>
          <h3>{title}</h3>
          <p>{caption}</p>
        </div>
        <div className="rp-chart-readout">
            <span className="muted small">{active.long}</span>
            <strong>{peso(active.amount)}</strong>
            <span className="muted small">{plural(active.count, 'payment')}</span>
        </div>
      </header>

      <div className="rp-chart">
        <div className="rp-chart-y" aria-hidden="true">
          <span>{pesoCompact(top)}</span>
          <span>{pesoCompact(top / 2)}</span>
          <span>₱0</span>
        </div>
        <div className="rp-chart-body">
          <div className="rp-chart-plot" onMouseLeave={() => setHover(null)}>
            <div className="rp-grid" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            {buckets.map((b, i) => {
              const height = b.amount > 0 ? Math.max((b.amount / top) * 100, 1.5) : 0
              return (
                <div
                  key={b.key}
                  className={`rp-col ${hover === i ? 'hover' : ''}`}
                  onMouseEnter={() => setHover(i)}
                  title={`${b.long}: ${peso(b.amount)}`}
                >
                  <div className="rp-bar" style={{ height: `${height}%` }} />
                </div>
              )
            })}
          </div>
          <div className="rp-chart-x" aria-hidden="true">
            {buckets.map((b, i) => (
              <span key={b.key}>{i % labelEvery === 0 ? b.short : ''}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Breakdown({ title, rows, labels, total }) {
  return (
    <div className="rp-breakdown">
      <div className="eyebrow">{title}</div>
      {rows.length === 0 ? (
        <p className="muted small rp-empty-line">No payments yet</p>
      ) : (
        rows.map((r) => {
          const share = Number(total) > 0 ? (Number(r.amount) / Number(total)) * 100 : 0
          return (
            <div key={r.key} className="rp-share">
              <div className="rp-share-top">
                <span className="strong">{labels[r.key] ?? r.key}</span>
                <span className="mono strong">{peso(r.amount)}</span>
              </div>
              <div className="rp-track" aria-hidden="true">
                <div className="rp-fill" style={{ width: `${share}%` }} />
              </div>
              <div className="rp-share-bottom muted small">
                <span>{plural(r.count, 'payment')}</span>
                <span>{Math.round(share)}%</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// ---------- page ----------

export default function ReportsPage() {
  const [preset, setPreset] = useState('today')
  const [range, setRange] = useState(() => presetRange('today').map(toIsoDate))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('payments')
  const [from, to] = range
  const todayIso = toIsoDate(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setReport(await api.getReport(from, to))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    load()
  }, [load])

  function choosePreset(key) {
    setPreset(key)
    setRange(presetRange(key).map(toIsoDate))
  }

  function chooseDate(which, value) {
    if (!value) return
    setPreset(null)
    setRange(([f, t]) => {
      const next = which === 'from' ? [value, t] : [f, value]
      return next[0] > next[1] ? [value, value] : next
    })
  }

  // One day: revenue per hour. Longer ranges: revenue per day.
  const chart = useMemo(() => {
    if (!report) return null
    if (report.byDay.length > 1) {
      return {
        title: 'Revenue per day',
        caption: `${report.byDay.length} days`,
        buckets: report.byDay.map((d) => {
          const date = fromIsoDate(d.date)
          return {
            key: d.date,
            short: String(date.getDate()),
            long: `${WEEKDAYS[date.getDay()]}, ${formatDate(date)}`,
            amount: Number(d.amount),
            count: d.count,
          }
        }),
      }
    }
    const hours = Array.from({ length: 24 }, (_, h) => ({
      key: h,
      short: h % 3 === 0 ? hourLabel(h) : '',
      long: `${hourLabel(h)} – ${hourLabel((h + 1) % 24)}`,
      amount: 0,
      count: 0,
    }))
    for (const p of report.payments) {
      const time = parseDateTime(p.paymentTime)
      if (!time) continue
      hours[time.getHours()].amount += Number(p.amount)
      hours[time.getHours()].count += 1
    }
    return { title: 'Revenue by hour', caption: 'When payments were taken', buckets: hours }
  }, [report])

  function exportPayments() {
    downloadCsv(
      `payments_${from}_to_${to}.csv`,
      ['Receipt', 'Ticket', 'Plate', 'Vehicle', 'Slot', 'Entry', 'Paid', 'Stay (min)', 'Method', 'Amount', 'Processed by'],
      report.payments.map((p) => [
        p.receiptNumber,
        p.ticketNumber,
        p.plateNumber,
        VEHICLE_LABEL[p.vehicleType] ?? p.vehicleType,
        p.slotNumber,
        isoDateTime(p.entryTime),
        isoDateTime(p.paymentTime),
        p.stayMinutes,
        METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod,
        Number(p.amount).toFixed(2),
        p.processedBy ?? '',
      ]),
    )
  }

  function exportVoids() {
    downloadCsv(
      `voided_${from}_to_${to}.csv`,
      ['Ticket', 'Plate', 'Slot', 'Entry', 'Voided', 'Stay (min)', 'Fee waived', 'Reason', 'Issued by', 'Voided by'],
      report.voids.map((v) => [
        v.ticketNumber,
        v.plateNumber,
        v.slotNumber,
        isoDateTime(v.entryTime),
        isoDateTime(v.voidedAt),
        v.stayMinutes,
        v.waivedFee == null ? '' : Number(v.waivedFee).toFixed(2),
        v.reason,
        v.issuedBy ?? '',
        v.voidedBy ?? '',
      ]),
    )
  }

  const t = report?.totals
  const rows = tab === 'payments' ? report?.payments : report?.voids

  return (
    <div className="page rp">
      <div className="rp-head">
        <div>
          <h2 className="rp-title">Reports</h2>
          <p className="rp-range-label">{rangeLabel(from, to)}</p>
        </div>
        <div className="rp-range">
          <div className="rp-segment" role="group" aria-label="Date range">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={preset === p.key ? 'active' : ''}
                onClick={() => choosePreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="rp-dates">
            <input
              type="date"
              aria-label="From"
              value={from}
              max={todayIso}
              onChange={(e) => chooseDate('from', e.target.value)}
            />
            <span>→</span>
            <input
              type="date"
              aria-label="To"
              value={to}
              max={todayIso}
              onChange={(e) => chooseDate('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading && !report && <p className="muted small">Loading report…</p>}

      {report && (
        <div className={`rp-body ${loading ? 'is-loading' : ''}`}>
          <section className="rp-kpis">
            <Kpi
              tone="hero"
              label="Revenue"
              value={peso(t.revenue)}
              sub={t.averageFee == null ? 'No payments in this period' : `Average ${peso(t.averageFee)} per vehicle`}
            />
            <Kpi
              label="Payments"
              value={t.payments}
              sub={t.averageStayMinutes == null ? 'No completed stays' : `Avg stay ${formatDuration(t.averageStayMinutes)}`}
            />
            <Kpi label="Tickets issued" value={t.ticketsIssued} sub="Vehicles that entered" />
            <Kpi
              tone={t.voids > 0 ? 'alert' : ''}
              label="Voided"
              value={t.voids}
              sub={t.voids === 0 ? 'No corrections' : `${peso(t.waived)} in fees waived`}
            />
          </section>

          <div className="rp-split">
            <RevenueChart key={`${from}_${to}`} {...chart} />
            <section className="rp-card rp-side">
              <header className="rp-card-head">
                <div>
                  <h3>Revenue mix</h3>
                  <p>Share of {peso(t.revenue)}</p>
                </div>
              </header>
              <div className="rp-side-body">
                <Breakdown title="Payment method" rows={report.byMethod} labels={METHOD_LABEL} total={t.revenue} />
                <Breakdown title="Vehicle type" rows={report.byVehicleType} labels={VEHICLE_LABEL} total={t.revenue} />
              </div>
            </section>
          </div>

          <section className="rp-card">
            <header className="rp-card-head">
              <div>
                <h3>Staff activity</h3>
                <p>Match the cash column against each attendant's drawer at the end of a shift.</p>
              </div>
            </header>
            <table className="table rp-table">
              <thead>
                <tr>
                  <th>Staff member</th>
                  <th className="right">Tickets issued</th>
                  <th className="right">Payments</th>
                  <th className="right">Voids</th>
                  <th className="right">Cash</th>
                  <th className="right">Total collected</th>
                </tr>
              </thead>
              <tbody>
                {report.byStaff.map((s) => (
                  <tr key={s.staffId ?? 'none'}>
                    <td>
                      <div className="rp-person">
                        <span className={`rp-avatar ${s.staffId == null ? 'none' : ''}`}>
                          {s.staffId == null ? '–' : initials(s.fullName)}
                        </span>
                        <div>
                          <div className="strong">{s.fullName}</div>
                          <div className="muted small mono">
                            {s.username ? `@${s.username}` : 'records from before staff login'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="mono right">{s.ticketsIssued}</td>
                    <td className="mono right">{s.payments}</td>
                    <td className="right">
                      {s.voids > 0 ? <span className="rp-void-count">{s.voids}</span> : <span className="mono muted">0</span>}
                    </td>
                    <td className="mono right">{peso(s.cash)}</td>
                    <td className="mono right strong">{peso(s.amount)}</td>
                  </tr>
                ))}
                {report.byStaff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      No activity in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="rp-card">
            <header className="rp-card-head rp-tabs-head">
              <div className="rp-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'payments'}
                  className={tab === 'payments' ? 'active' : ''}
                  onClick={() => setTab('payments')}
                >
                  Payments <span className="rp-count">{report.payments.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'voids'}
                  className={tab === 'voids' ? 'active' : ''}
                  onClick={() => setTab('voids')}
                >
                  Voided tickets <span className="rp-count">{report.voids.length}</span>
                </button>
              </div>
              <button
                type="button"
                className="btn ghost rp-export"
                disabled={rows.length === 0}
                onClick={tab === 'payments' ? exportPayments : exportVoids}
              >
                ↓ Export CSV
              </button>
            </header>

            {tab === 'payments' ? (
              <table className="table rp-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Vehicle</th>
                    <th>Paid at</th>
                    <th>Stay</th>
                    <th>Method</th>
                    <th>Taken by</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.payments.map((p) => (
                    <tr key={p.receiptNumber}>
                      <td className="mono brand">{p.receiptNumber}</td>
                      <td>
                        <div className="strong">{p.plateNumber}</div>
                        <div className="muted small">
                          {VEHICLE_LABEL[p.vehicleType] ?? p.vehicleType} · slot {p.slotNumber}
                        </div>
                      </td>
                      <td className="mono muted">{formatDateTime(parseDateTime(p.paymentTime))}</td>
                      <td className="mono muted">{formatDuration(p.stayMinutes)}</td>
                      <td>
                        <span className={`tag method-${p.paymentMethod?.toLowerCase()}`}>
                          {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}
                        </span>
                      </td>
                      <td className="muted">{p.processedBy ?? '—'}</td>
                      <td className="mono right strong">{peso(p.amount)}</td>
                    </tr>
                  ))}
                  {report.payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        No payments in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="table rp-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Vehicle</th>
                    <th>Voided at</th>
                    <th>Reason</th>
                    <th>Issued by</th>
                    <th>Voided by</th>
                    <th className="right">Fee waived</th>
                  </tr>
                </thead>
                <tbody>
                  {report.voids.map((v) => (
                    <tr key={v.ticketNumber}>
                      <td className="mono brand">{v.ticketNumber}</td>
                      <td>
                        <div className="strong">{v.plateNumber}</div>
                        <div className="muted small">
                          slot {v.slotNumber} · stayed {formatDuration(v.stayMinutes)}
                        </div>
                      </td>
                      <td className="mono muted">{formatDateTime(parseDateTime(v.voidedAt))}</td>
                      <td className="rp-reason">{v.reason ?? '—'}</td>
                      <td className="muted">{v.issuedBy ?? '—'}</td>
                      <td className="muted">{v.voidedBy ?? '—'}</td>
                      <td className="mono right">{v.waivedFee == null ? '—' : peso(v.waivedFee)}</td>
                    </tr>
                  ))}
                  {report.voids.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        No tickets were voided in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
