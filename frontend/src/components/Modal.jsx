import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ children, onClose, width = 360, className = '' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${className}`} style={{ width }} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  )
}
