import './admin.css'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'

const NAV = [
  { path: '/admin/dashboard', label: '📊 Dashboard' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const token = sessionStorage.getItem('admin_token')

  useEffect(() => {
    if (!token) navigate('/admin/login')
  }, [token])

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch {}
    sessionStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout admin-layout-no-sidebar">
      <main className="admin-main">
        <div className="admin-main-topbar">
          <div className="admin-main-title">⚡ Admin Panel</div>
          <div className="admin-main-actions">
            <a href="/" target="_blank" rel="noreferrer" className="admin-btn-ghost admin-main-link">View Site</a>
            <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
