import { useCallback, useEffect, useState } from 'react'

export const PAGES = ['lot', 'sessions', 'payments', 'settings']

function readHash() {
  const page = window.location.hash.replace(/^#\/?/, '')
  return PAGES.includes(page) ? page : 'lot'
}

export function useHashRoute() {
  const [page, setPage] = useState(readHash)

  useEffect(() => {
    const onChange = () => setPage(readHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next) => {
    window.location.hash = `/${next}`
  }, [])

  return [page, navigate]
}
