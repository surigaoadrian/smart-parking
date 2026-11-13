import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

const POLL_MS = 10_000
const DEFAULT_LOT_ID = Number(import.meta.env.VITE_LOT_ID ?? 1)

function useStoredList(key) {
  const [list, setList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? []
    } catch {
      return []
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(list))
  }, [key, list])
  return [list, setList]
}

export function useParkingData() {
  const [slots, setSlots] = useState([])
  const [tickets, setTickets] = useState([])
  const [lot, setLot] = useState(null)
  const [online, setOnline] = useState(null)
  const [serverPayments, setServerPayments] = useState(null)
  // Payments come from GET /api/payments; the localStorage copy is only a fallback
  // for when that request fails. Voids are saved on the server (POST /tickets/{n}/void);
  // this local list only feeds the "voided today" summary on the Payments page.
  const [localPayments, setLocalPayments] = useStoredList('smart-parking.payments')
  const [voids, setVoids] = useStoredList('smart-parking.voids')

  const refresh = useCallback(async () => {
    try {
      const [slotList, ticketList] = await Promise.all([api.getSlots(), api.getActiveTickets()])
      setSlots(slotList)
      setTickets(ticketList)
      setOnline(true)

      const lotId = slotList[0]?.parkingLot?.id ?? DEFAULT_LOT_ID
      const [lotResult, paymentsResult] = await Promise.allSettled([
        api.getLot(lotId),
        api.getPayments(),
      ])
      if (lotResult.status === 'fulfilled') setLot(lotResult.value)
      setServerPayments(paymentsResult.status === 'fulfilled' ? paymentsResult.value : null)
    } catch {
      setOnline(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const recordPayment = useCallback(
    (payment) =>
      setLocalPayments((list) => [
        payment,
        ...list.filter((p) => p.receiptNumber !== payment.receiptNumber),
      ]),
    [setLocalPayments],
  )

  const recordVoid = useCallback((entry) => setVoids((list) => [entry, ...list]), [setVoids])

  return {
    slots,
    tickets,
    lot,
    setLot,
    online,
    payments: serverPayments ?? localPayments,
    paymentsSource: serverPayments ? 'server' : 'local',
    voids,
    refresh,
    recordPayment,
    recordVoid,
  }
}
