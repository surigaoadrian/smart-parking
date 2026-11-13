import logo from '../assets/logo-128.png'
import { IconCar, IconCard, IconLot, IconSearch, IconSliders } from './Icons'

const NAV = [
  { key: 'lot', label: 'Lot', Icon: IconLot },
  { key: 'sessions', label: 'Sessions', Icon: IconCar },
  { key: 'payments', label: 'Payments', Icon: IconCard },
  { key: 'settings', label: 'Settings', Icon: IconSliders },
]

export default function Sidebar({ page, onNavigate, onFind }) {
  return (
    <aside className="sidebar">
      <img className="logo" src={logo} alt="Smart Parking" />
      <nav className="nav">
        {NAV.map(({ key, label, Icon }) => (
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
