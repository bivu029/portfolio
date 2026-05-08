import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../api'

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` })

export default function CredentialsAdmin() {
  const navigate = useNavigate()
  const [currentUsername, setCurrentUsername] = useState('')
  const [form, setForm] = useState({ old_password: '', new_username: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/admin/credentials`, { headers: headers() })
      .then(async res => {
        if (!res.ok) {
          throw new Error((await res.json()).detail || 'Unable to load credentials')
        }
        return res.json()
      })
      .then(data => setCurrentUsername(data.username))
      .catch(() => setCurrentUsername('admin'))
  }, [])

  const save = async () => {
    setError('')
    if (!form.old_password.trim()) {
      setError('Current password is required.')
      return
    }
    if (!form.new_username.trim()) {
      setError('New username is required.')
      return
    }
    if (!form.new_password) {
      setError('New password is required.')
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/admin/credentials`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({
          old_password: form.old_password,
          new_username: form.new_username,
          new_password: form.new_password
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to update credentials')
      setSaved(true)
      setCurrentUsername(form.new_username)
      setForm({ ...form, old_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">🔐 Credentials</h1>
          <p className="admin-page-desc">Update your admin username and password.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Current Account</h3>
        <p className="admin-card-desc">Only the username is shown here. Password is never exposed.</p>
        <div className="admin-field">
          <label>Current Username</label>
          <input type="text" value={currentUsername} disabled />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Update Credentials</h3>
        <p className="admin-card-desc">Enter your current password, then set a new username and password.</p>

        {error && <div className="admin-error">{error}</div>}
        {saved && <div className="admin-success">✅ Credentials updated successfully.</div>}

        <div className="admin-field">
          <label>Current Password</label>
          <input
            type="password"
            value={form.old_password}
            onChange={e => setForm({ ...form, old_password: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label>New Username</label>
          <input
            type="text"
            value={form.new_username}
            onChange={e => setForm({ ...form, new_username: e.target.value })}
            placeholder={currentUsername || 'admin'}
          />
        </div>
        <div className="admin-field">
          <label>New Password</label>
          <input
            type="password"
            value={form.new_password}
            onChange={e => setForm({ ...form, new_password: e.target.value })}
          />
        </div>
        <div className="admin-field">
          <label>Confirm New Password</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={e => setForm({ ...form, confirm_password: e.target.value })}
          />
        </div>

        <div className="admin-page-footer">
          <button className="admin-btn-primary" onClick={save} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
