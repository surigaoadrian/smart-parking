import { useMemo } from 'react'

// Decorative barcode derived from the ticket number; not a scannable symbology.
export default function Barcode({ value, height = 56 }) {
  const { bars, width } = useMemo(() => {
    const bars = []
    let x = 0
    for (const ch of value) {
      const code = ch.charCodeAt(0)
      for (let i = 0; i < 4; i++) {
        const w = ((code >> i) & 1) + 1
        bars.push({ x, w })
        x += w + ((code >> (i + 2)) & 1) + 1
      }
    }
    return { bars, width: x }
  }, [value])

  return (
    <svg
      className="barcode"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {bars.map((b) => (
        <rect key={b.x} x={b.x} y="0" width={b.w} height={height} fill="currentColor" />
      ))}
    </svg>
  )
}
