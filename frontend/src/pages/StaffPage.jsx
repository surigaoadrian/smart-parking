import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { formatDate, parseDateTime } from '../utils'
import StaffFormModal from '../modals/StaffFormModal'
import ResetPasswordModal from '../modals/ResetPasswordModal'
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal'

const ROLE_LABEL = { ADMIN: 'Admin', ATTENDANT: 'Attendant' }

export default function StaffPage({ currentUser, notify }) {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      setStaff(await api.getStaff())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function update(member, changes, message) {
    setBusyId(member.id)
    setError('')
    try {
      await api.updateStaff(member.id, changes)
      notify(message)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function create(form) {
    const created = await api.createStaff(form)
    setModal(null)
    notify(`Account created for ${created.fullName} (@${created.username})`)
    await load()
  }

  async function remove(member) {
    await api.deleteStaff(member.id)
    setModal(null)
    notify(`${member.fullName}'s account was deleted`)
    await load()
  }

  // Why an action is not allowed for this row (shown as a tooltip), or null when allowed.
  function lockReason(member, action) {
    if (member.owner) return `The main admin account cannot be ${action}`
    if (member.id === currentUser.id) return `You cannot ${action === 'deleted' ? 'delete' : 'change'} your own account`
    if (action === 'deleted' && member.activityCount > 0)
      return `Has handled ${member.activityCount} ticket(s) or payment(s) — deactivate instead to keep the records`
    return null
  }

  async function resetPassword(member, newPassword) {
    await api.resetStaffPassword(member.id, newPassword)
    setModal(null)
    notify(`Password reset for ${member.fullName}`)
  }

  const activeCount = staff.filter((s) => s.active).length

  return (
    <div className="page">
      <div className="toolbar">
        <div>
          <h2 className="page-title">Staff accounts</h2>
          <p className="muted small">
            {activeCount} active of {staff.length}. Accounts that have handled tickets or payments can only be
            deactivated, so the records keep who did what. Unused accounts can be deleted.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={() => setModal({ type: 'create' })}>
          + Add staff
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const busy = busyId === member.id
              const roleLock = lockReason(member, 'demoted')
              const deactivateLock = lockReason(member, 'deactivated')
              const deleteLock = lockReason(member, 'deleted')
              return (
                <tr key={member.id} className={member.active ? '' : 'inactive-row'}>
                  <td className="strong">
                    {member.fullName}
                    {member.owner && <span className="tag brand-tag">main admin</span>}
                    {member.id === currentUser.id && <span className="tag">you</span>}
                  </td>
                  <td className="mono muted">@{member.username}</td>
                  <td>
                    <select
                      className="select"
                      value={member.role}
                      disabled={!!roleLock || busy}
                      title={roleLock ?? undefined}
                      onChange={(e) =>
                        update(
                          member,
                          { role: e.target.value },
                          `${member.fullName} is now ${ROLE_LABEL[e.target.value]}`,
                        )
                      }
                    >
                      <option value="ATTENDANT">Attendant</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`tag ${member.active ? 'ok' : ''}`}>
                      {member.active ? 'active' : 'deactivated'}
                    </span>
                  </td>
                  <td className="mono muted">{formatDate(parseDateTime(member.createdAt))}</td>
                  <td className="right">
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn xs ghost"
                        disabled={busy}
                        onClick={() => setModal({ type: 'reset', member })}
                      >
                        Reset password
                      </button>
                      {member.active ? (
                        <button
                          type="button"
                          className="btn xs danger-outline"
                          disabled={!!deactivateLock || busy}
                          title={deactivateLock ?? undefined}
                          onClick={() => update(member, { active: false }, `${member.fullName} deactivated`)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn xs primary"
                          disabled={busy}
                          onClick={() => update(member, { active: true }, `${member.fullName} reactivated`)}
                        >
                          Reactivate
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn xs danger"
                        disabled={!!deleteLock || busy}
                        title={deleteLock ?? 'Permanently delete this account'}
                        onClick={() => setModal({ type: 'delete', member })}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No staff accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === 'create' && <StaffFormModal onClose={() => setModal(null)} onSubmit={create} />}
      {modal?.type === 'delete' && (
        <ConfirmDeleteModal
          member={modal.member}
          onClose={() => setModal(null)}
          onConfirm={() => remove(modal.member)}
        />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal
          title={`Reset password for ${modal.member.fullName}`}
          description="Give the new password to the staff member. They can change it after signing in."
          onClose={() => setModal(null)}
          onSubmit={({ newPassword }) => resetPassword(modal.member, newPassword)}
        />
      )}
    </div>
  )
}
