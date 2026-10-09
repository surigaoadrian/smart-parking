import { useCallback, useState } from 'react'

let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, tone = 'ok') => {
    const id = nextId++
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000)
  }, [])

  return { toasts, notify }
}
