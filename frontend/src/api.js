// Thin client for the Spring Boot backend (see parking-management/Controller).
//
// Login is cookie based: the browser keeps the session cookie automatically.
// Requests that change data must also send the CSRF token that the backend puts in the
// XSRF-TOKEN cookie, echoed back in the X-XSRF-TOKEN header.

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }

  // Spring answers 404 for unknown paths and 405 when only another verb is mapped.
  get missingEndpoint() {
    return this.status === 404 || this.status === 405
  }
}

// Fired when the session ends (expired, logged out elsewhere, account deactivated).
export const AUTH_EXPIRED_EVENT = 'smart-parking:auth-expired'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

function readCsrfCookie() {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function ensureCsrfToken() {
  if (!readCsrfCookie()) {
    await fetch('/api/auth/csrf', { credentials: 'same-origin' })
  }
  return readCsrfCookie()
}

async function send(path, method, body) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (!SAFE_METHODS.includes(method)) {
    const token = await ensureCsrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
  }
  return fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  })
}

async function errorMessage(res) {
  try {
    const data = await res.json()
    return data.message || data.error || ''
  } catch {
    return '' // non-JSON error body
  }
}

async function request(path, { method = 'GET', body, authCheck = false } = {}) {
  let res
  try {
    res = await send(path, method, body)
    // A stale CSRF cookie (e.g. after logging out) gets one automatic retry with a fresh token.
    if (res.status === 403 && !SAFE_METHODS.includes(method)) {
      const message = await errorMessage(res.clone())
      if (message.startsWith('Security token')) {
        document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
        res = await send(path, method, body)
      }
    }
  } catch {
    throw new ApiError('Cannot reach the server', 0)
  }

  if (!res.ok) {
    const detail = await errorMessage(res)
    // Session gone mid-shift: tell the app to show the login screen.
    if (res.status === 401 && !authCheck) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail }))
    }
    throw new ApiError(detail || `Request failed (${res.status})`, res.status)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  // ---- login & own account
  me: () => request('/auth/me', { authCheck: true }),
  // portal: 'ATTENDANT' (/login) or 'ADMIN' (/admin); the server checks the account's role matches.
  login: (username, password, portal) =>
    request('/auth/login', { method: 'POST', body: { username, password, portal }, authCheck: true }),
  logout: () => request('/auth/logout', { method: 'POST', authCheck: true }),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', { method: 'POST', body: { currentPassword, newPassword } }),

  // ---- staff accounts (admin only)
  getStaff: () => request('/staff'),
  createStaff: (staff) => request('/staff', { method: 'POST', body: staff }),
  updateStaff: (id, changes) => request(`/staff/${id}`, { method: 'PATCH', body: changes }),
  // Only works for accounts that never handled a ticket or payment; others are deactivated instead.
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),
  resetStaffPassword: (id, newPassword) =>
    request(`/staff/${id}/reset-password`, { method: 'POST', body: { newPassword } }),

  // ---- reports (admin only). from/to: 'YYYY-MM-DD', both inclusive.
  getReport: (from, to) =>
    request(`/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  // ---- parking
  getSlots: () => request('/slots'),
  getActiveTickets: () => request('/tickets/active'),
  getTicket: (ticketNumber) => request(`/tickets/${encodeURIComponent(ticketNumber)}`),
  getLot: (id) => request(`/parking-lots/${id}`),
  updateLot: (id, lot) => request(`/parking-lots/${id}`, { method: 'PUT', body: lot }),
  // layout: [{ slotNumber, slotType, closed }] — the full desired set of slots.
  updateLayout: (id, layout) => request(`/parking-lots/${id}/slots`, { method: 'PUT', body: layout }),

  // slotNumber is optional; without it the server auto-picks a free slot of slotType.
  enterVehicle: ({ plateNumber, vehicleType, slotType, slotNumber }) =>
    request('/parking/entry', {
      method: 'POST',
      body: { plateNumber, vehicleType, slotType, slotNumber },
    }),

  pay: ({ ticketNumber, paymentMethod }) =>
    request('/payments', { method: 'POST', body: { ticketNumber, paymentMethod } }),

  // Admins get every payment, attendants only today's.
  getPayments: () => request('/payments'),

  // Marks the ticket VOIDED on the server and releases its slot.
  voidTicket: (ticketNumber, reason) =>
    request(`/tickets/${encodeURIComponent(ticketNumber)}/void`, {
      method: 'POST',
      body: { reason },
    }),
}
