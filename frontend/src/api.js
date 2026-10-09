// Thin client for the Spring Boot backend (see parking-management/Controller).

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

async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server', 0)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data.message || data.error || ''
    } catch {
      // non-JSON error body
    }
    throw new ApiError(detail || `Request failed (${res.status})`, res.status)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
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

  getPayments: () => request('/payments'),

  // Not implemented by the backend yet.
  async voidTicket(ticketNumber, reason) {
    try {
      return await request(`/tickets/${encodeURIComponent(ticketNumber)}/void`, {
        method: 'POST',
        body: { reason },
      })
    } catch (err) {
      if (err instanceof ApiError && err.missingEndpoint) {
        throw new ApiError(
          'The backend has no void endpoint yet (POST /api/tickets/{ticketNumber}/void).',
          err.status,
        )
      }
      throw err
    }
  },
}
