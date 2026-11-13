const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconLot = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 21v-7h4a2.5 2.5 0 0 1 0 5h-4" />
  </svg>
)

export const IconCar = () => (
  <svg {...base}>
    <path d="M5 17h14v-4l-2-5H7l-2 5v4Z" />
    <path d="M5 13h14" />
    <circle cx="8" cy="17" r="1.6" />
    <circle cx="16" cy="17" r="1.6" />
  </svg>
)

export const IconCard = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </svg>
)

export const IconSliders = () => (
  <svg {...base}>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
)

export const IconMotorcycle = ({ size = 16 }) => (
  <svg {...base} width={size} height={size}>
    <circle cx="5.5" cy="16.5" r="3" />
    <circle cx="18.5" cy="16.5" r="3" />
    <path d="M5.5 16.5 9 10h6l3.5 6.5" />
    <path d="M15 10l-1.5-3H11M9 10l2.5 6.5h3" />
  </svg>
)

export const IconWheelchair = ({ size = 16 }) => (
  <svg {...base} width={size} height={size}>
    <circle cx="11" cy="4" r="1.6" />
    <path d="M11 7.5v6h5.5l2.5 5" />
    <path d="M11 10.5h5" />
    <path d="M8 10.8a5.5 5.5 0 1 0 7.6 7.2" />
  </svg>
)

export const IconSearch = () => (
  <svg {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
)

export const IconChart = () => (
  <svg {...base}>
    <path d="M4 20h16" />
    <path d="M7 16v-5M12 16V6M17 16v-8" />
  </svg>
)

export const IconUsers = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17.5 14.2A5.5 5.5 0 0 1 20.5 19" />
  </svg>
)
