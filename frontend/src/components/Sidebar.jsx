import logo from '../assets/logo-128.png'
import { IconCar, IconCard, IconChart, IconLot, IconSearch, IconSliders, IconUsers } from './Icons'

// adminOnly pages are hidden from attendants (the backend also refuses their requests).
export const NAV = [
  { key: 'lot', label: 'Lot', Icon: IconLot },
  { key: 'sessions', label: 'Sessions', Icon: IconCar },
  { key: 'payments', label: 'Payments', Icon: IconCard },
  { key: 'reports', label: 'Reports', Icon: IconChart, adminOnly: true },
  { key: 'settings', label: 'Settings', Icon: IconSliders, adminOnly: true },
  { key: 'staff', label: 'Staff', Icon: IconUsers, adminOnly: true },
]

export default function Sidebar({ page, isAdmin, onNavigate, onFind }) {
  const items = NAV.filter((item) => isAdmin || !item.adminOnly)

  return (
    <aside className="sidebar">
      <img className="logo" src={logo} alt="Smart Parking" />
      <nav className="nav">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${page === key ? 'active' : ''}`}
            onClick={() => onNavigate(key)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="nav sidebar-bottom">
        <button type="button" className="nav-item" onClick={onFind}>
          <IconSearch />
          <span>Find</span>
        </button>
      </div>
    </aside>
  )
}
