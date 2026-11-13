import { useState } from 'react'
import logo from '../assets/logo-128.png'

const PORTAL_TEXT = {
  ATTENDANT: { label: 'Staff sign in', switchText: 'Administrator? Use the admin sign in' },
  ADMIN: { label: 'Admin sign in', switchText: 'Parking attendant? Use the staff sign in' },
}

export default function LoginPage({ portal = 'ATTENDANT', onLogin, onSwitchPortal, notice }) {
  const text = PORTAL_TEXT[portal]
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onLogin(username.trim(), password)
    } catch (err) {
      setError(err.message)
      setPassword('')
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit} noValidate>
        <div className="login-brand">
          <img src={logo} alt="" className="login-logo" />
          <div>
            <h1>Smart Parking</h1>
            <span className={`eyebrow ${portal === 'ADMIN' ? 'admin-eyebrow' : ''}`}>{text.label}</span>
          </div>
        </div>

        {notice && !error && <div className="alert warn">{notice}</div>}

        <div className="form">
          <label>
            <span className="eyebrow">Username</span>
            <input
              className="text-input"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            <span className="eyebrow">Password</span>
            <input
              className="text-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>

        {error && <div className="alert error">{error}</div>}

        <button type="submit" className="btn primary lg block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="hint">
          Forgot your password? Ask {portal === 'ADMIN' ? 'another' : 'an'} admin to reset it.
        </p>
        <button type="button" className="link-button" onClick={onSwitchPortal}>
          {text.switchText}
        </button>
      </form>
    </div>
  )
}
