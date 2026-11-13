import { useCallback, useEffect, useState } from 'react'
import { api, AUTH_EXPIRED_EVENT } from './api'
import App from './App'
import LoginPage from './pages/LoginPage'

// Login pages: attendants sign in at /login, admins at /admin. The console itself lives at /.
const LOGIN_PATH = { ATTENDANT: '/login', ADMIN: '/admin' }
const LOGIN_PATHS = Object.values(LOGIN_PATH)

function currentPath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function goTo(path) {
  window.history.replaceState(null, '', path)
}

// Decides what to show: a loading screen, a login page, or the console for the signed-in staff member.
export default function AuthGate() {
  // undefined = still checking, null = not signed in, object = signed-in staff member
  const [user, setUser] = useState(undefined)
  const [path, setPath] = useState(currentPath)
  const [notice, setNotice] = useState('')

  const navigate = useCallback((to) => {
    goTo(to)
    setPath(currentPath())
  }, [])

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  // Keep the address bar in step with who is signed in.
  useEffect(() => {
    if (user === undefined) return
    if (user && LOGIN_PATHS.includes(path)) navigate('/#/lot') // signed in -> console
    if (!user && !LOGIN_PATHS.includes(path)) navigate(LOGIN_PATH.ATTENDANT) // signed out -> staff login
  }, [user, path, navigate])

  // Any request that comes back 401 (session expired, account deactivated) ends the session here.
  useEffect(() => {
    const onExpired = (e) => {
      setUser((current) => {
        if (current) {
          setNotice(e.detail || 'Your session has ended. Please sign in again.')
          navigate(LOGIN_PATH[current.role] ?? LOGIN_PATH.ATTENDANT)
        }
        return null
      })
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [navigate])

  const portal = path === LOGIN_PATH.ADMIN ? 'ADMIN' : 'ATTENDANT'

  const login = useCallback(
    async (username, password) => {
      const staff = await api.login(username, password, portal)
      setNotice('')
      setUser(staff)
    },
    [portal],
  )

  const logout = useCallback(async () => {
    const role = user?.role
    try {
      await api.logout()
    } finally {
      setNotice('')
      setUser(null)
      navigate(LOGIN_PATH[role] ?? LOGIN_PATH.ATTENDANT)
    }
  }, [user, navigate])

  if (user === undefined) {
    return <div className="login-screen muted">Loading…</div>
  }
  if (!user) {
    return (
      <LoginPage
        key={portal}
        portal={portal}
        notice={notice}
        onLogin={login}
        onSwitchPortal={() => {
          setNotice('')
          navigate(portal === 'ADMIN' ? LOGIN_PATH.ATTENDANT : LOGIN_PATH.ADMIN)
        }}
      />
    )
  }
  // key: remount the console (fresh data, no leftover state) whenever a different person signs in.
  return <App key={user.id} user={user} onLogout={logout} />
}
