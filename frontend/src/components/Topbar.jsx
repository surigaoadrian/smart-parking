import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../utils'

const ROLE_LABEL = { ADMIN: 'Admin', ATTENDANT: 'Attendant' }

function UserMenu({ user, onChangePassword, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const initials = user.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="avatar">{initials}</span>
        <span className="user-text">
          <span className="user-name">{user.fullName}</span>
          <span className="user-role">{ROLE_LABEL[user.role] ?? user.role}</span>
        </span>
      </button>
      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-head">
            <span className="strong">{user.fullName}</span>
            <span className="mono muted small">@{user.username}</span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onChangePassword()
            }}
          >
            Change password
          </button>
          <button type="button" role="menuitem" className="danger-text" onClick={onLogout}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Topbar({ subtitle, overstayCount, online, now, onOverstay, user, onChangePassword, onLogout }) {
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
        <UserMenu user={user} onChangePassword={onChangePassword} onLogout={onLogout} />
      </div>
    </header>
  )
}
