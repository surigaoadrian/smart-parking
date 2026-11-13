import { useMemo, useState } from 'react'
import { api } from './api'
import { useParkingData } from './hooks/useParkingData'
import { useHashRoute } from './hooks/useHashRoute'
import { useNow } from './hooks/useNow'
import { useToasts } from './hooks/useToasts'
import { compareSlotNumbers, isToday, parseDateTime, toSession } from './utils'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatsBar from './components/StatsBar'
import Toasts from './components/Toasts'
import LotPage from './pages/lot/LotPage'
import SessionsPage from './pages/SessionsPage'
import PaymentsPage from './pages/PaymentsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import StaffPage from './pages/StaffPage'
import TicketModal from './modals/TicketModal'
import VoidModal from './modals/VoidModal'
import ReceiptModal from './modals/ReceiptModal'
import FindModal from './modals/FindModal'
import OverstayModal from './modals/OverstayModal'
import ResetPasswordModal from './modals/ResetPasswordModal'
import { NAV } from './components/Sidebar'

const SUBTITLES = {
  lot: 'Attendant console',
  sessions: 'Active sessions',
  payments: 'Payments & receipts',
  reports: 'Revenue & activity',
  settings: 'Lot configuration',
  staff: 'Staff accounts',
}

const ADMIN_ONLY_PAGES = NAV.filter((item) => item.adminOnly).map((item) => item.key)

export default function App({ user, onLogout }) {
  const isAdmin = user.role === 'ADMIN'
  const [routePage, navigate] = useHashRoute()
  // Attendants who open an admin page (old link, typed URL) land on the lot instead.
  const page = !isAdmin && ADMIN_ONLY_PAGES.includes(routePage) ? 'lot' : routePage
  const now = useNow(1000)
  const data = useParkingData()
  const { toasts, notify } = useToasts()
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [modal, setModal] = useState(null)
  const closeModal = () => setModal(null)

  const sessions = useMemo(
    () =>
      data.tickets
        .map((t) => toSession(t, now, data.lot))
        .sort((a, b) => compareSlotNumbers(a.slotNumber, b.slotNumber)),
    [data.tickets, data.lot, now],
  )
  const overstays = sessions.filter((s) => s.overstay)
  const selectedSession = sessions.find((s) => s.ticketNumber === selectedTicket) ?? null

  const stats = {
    occupied: data.slots.filter((s) => s.status === 'OCCUPIED').length,
    total: data.slots.length,
    available: data.slots.filter((s) => s.status === 'AVAILABLE').length,
    avgStayMinutes: sessions.length
      ? Math.round(sessions.reduce((sum, s) => sum + s.minutes, 0) / sessions.length)
      : null,
    revenueToday: data.payments
      .filter((p) => p.status === 'PAID' && isToday(parseDateTime(p.paymentTime)))
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
  }

  function checkOut(session) {
    setSelectedTicket(session.ticketNumber)
    setModal(null)
    navigate('lot')
  }

  async function issueTicket(request) {
    const ticket = await api.enterVehicle(request)
    await data.refresh()
    setModal({ type: 'ticket', session: toSession(ticket, new Date(), data.lot) })
    notify(`Ticket ${ticket.ticketNumber} issued · slot ${ticket.parkingSlot?.slotNumber}`)
  }

  async function takePayment(session, paymentMethod) {
    const payment = await api.pay({ ticketNumber: session.ticketNumber, paymentMethod })
    data.recordPayment(payment)
    setSelectedTicket(null)
    setModal({ type: 'receipt', payment, session })
    data.refresh()
  }

  async function voidTicket(session, reason) {
    await api.voidTicket(session.ticketNumber, reason)
    data.recordVoid({
      ticketNumber: session.ticketNumber,
      plate: session.plate,
      slotNumber: session.slotNumber,
      reason,
      fee: session.fee?.total ?? 0,
      at: new Date().toISOString(),
    })
    if (selectedTicket === session.ticketNumber) setSelectedTicket(null)
    setModal(null)
    notify(`${session.ticketNumber} voided · slot ${session.slotNumber} released`)
    data.refresh()
  }

  async function changeOwnPassword({ currentPassword, newPassword }) {
    await api.changePassword(currentPassword, newPassword)
    setModal(null)
    notify('Password changed')
  }

  async function saveConfiguration({ lot, layout }) {
    if (layout) await api.updateLayout(data.lot.id, layout)
    if (lot) data.setLot(await api.updateLot(lot.id, lot))
    await data.refresh()
    notify('Configuration saved')
  }

  const openTicket = (session) => setModal({ type: 'ticket', session })
  const openVoid = (session) => setModal({ type: 'void', session })

  return (
    <div className="app">
      <Sidebar
        page={page}
        isAdmin={isAdmin}
        onNavigate={navigate}
        onFind={() => setModal({ type: 'find' })}
      />

      <main className="main">
        <Topbar
          subtitle={SUBTITLES[page]}
          overstayCount={overstays.length}
          online={data.online}
          now={now}
          onOverstay={() => setModal({ type: 'overstay' })}
          user={user}
          onChangePassword={() => setModal({ type: 'password' })}
          onLogout={onLogout}
        />
        {/* Reports has its own figures for the chosen period; live lot stats would compete with them. */}
        {page !== 'reports' && <StatsBar {...stats} />}

        {data.online === false && (
          <div className="banner">
            Can't reach the backend at <code>/api</code>. Make sure the Spring Boot app is running on
            port 8080 — retrying automatically.
          </div>
        )}

        <div className="content">
          {page === 'lot' && (
            <LotPage
              slots={data.slots}
              sessions={sessions}
              lot={data.lot}
              now={now}
              selectedSession={selectedSession}
              onSelect={(s) => setSelectedTicket(s.ticketNumber)}
              onClearSelection={() => setSelectedTicket(null)}
              onIssue={issueTicket}
              onPay={takePayment}
              onVoid={openVoid}
              onShowTicket={openTicket}
              onViewAll={() => navigate('sessions')}
            />
          )}
          {page === 'sessions' && (
            <SessionsPage
              sessions={sessions}
              onVoid={openVoid}
              onShowTicket={openTicket}
              onCheckOut={checkOut}
            />
          )}
          {page === 'payments' && (
            <PaymentsPage payments={data.payments} voids={data.voids} source={data.paymentsSource} />
          )}
          {page === 'reports' && isAdmin && <ReportsPage />}
          {page === 'settings' && isAdmin && (
            <SettingsPage lot={data.lot} slots={data.slots} onSave={saveConfiguration} />
          )}
          {page === 'staff' && isAdmin && <StaffPage currentUser={user} notify={notify} />}
        </div>
      </main>

      {modal?.type === 'ticket' && (
        <TicketModal
          session={modal.session}
          lot={data.lot}
          onClose={closeModal}
          onVoid={() => openVoid(modal.session)}
        />
      )}
      {modal?.type === 'void' && (
        <VoidModal
          session={modal.session}
          isAdmin={isAdmin}
          voidWindowMinutes={data.lot?.voidWindowMinutes ?? 15}
          onClose={closeModal}
          onConfirm={voidTicket}
        />
      )}
      {modal?.type === 'receipt' && (
        <ReceiptModal payment={modal.payment} session={modal.session} onClose={closeModal} />
      )}
      {modal?.type === 'find' && <FindModal sessions={sessions} onPick={checkOut} onClose={closeModal} />}
      {modal?.type === 'overstay' && (
        <OverstayModal
          sessions={overstays}
          limitHours={data.lot?.overstayAfterHours}
          onResolve={checkOut}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'password' && (
        <ResetPasswordModal
          title="Change your password"
          askCurrent
          onClose={closeModal}
          onSubmit={changeOwnPassword}
        />
      )}

      <Toasts toasts={toasts} />
    </div>
  )
}
