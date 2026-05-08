import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` })

export default function AnalyticsAdmin() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState('')

  const loadAnalytics = () => {
    setLoading(true)
    fetch(`${API}/api/analytics`)
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics({}))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const visitors = analytics?.visitors || {}
  const sources = analytics?.sources || []

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📊 Analytics</h1>
          <p className="admin-page-copy">Track visitor growth and acquisition sources.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 className="admin-card-title">Visitor Overview</h3>
            <p className="admin-card-desc">Summary of visitor traffic over key time periods.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="admin-btn-danger-sm"
              onClick={async () => {
                if (!window.confirm('Reset analytics and start tracking from zero?')) return
                setResetting(true)
                setMessage('')
                try {
                  const res = await fetch(`${API}/admin/analytics/reset`, { method: 'POST', headers: headers() })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.detail || 'Reset failed')
                  setMessage(data.message)
                  loadAnalytics()
                } catch (err) {
                  setMessage(err.message)
                } finally {
                  setResetting(false)
                }
              }}
              disabled={resetting}
            >
              {resetting ? 'Resetting...' : 'Reset to zero'}
            </button>
          </div>
        </div>

        {message && <div className={message.includes('failed') ? 'admin-error' : 'admin-success'} style={{ marginBottom: '1rem' }}>{message}</div>}

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <div className="admin-stats-grid">
            <div className="analytics-stat-card">
              <span>Today</span>
              <strong>{visitors.today ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Last 7 days</span>
              <strong>{visitors.last_7_days ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Last 15 days</span>
              <strong>{visitors.last_15_days ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Monthly</span>
              <strong>{visitors.monthly ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Last 3 months</span>
              <strong>{visitors.last_3_months ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Last 6 months</span>
              <strong>{visitors.last_6_months ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Last 12 months</span>
              <strong>{visitors.last_12_months ?? '-'}</strong>
            </div>
            <div className="analytics-stat-card">
              <span>Total</span>
              <strong>{visitors.total ?? '-'}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Traffic Sources</h3>
        <p className="admin-card-desc">Where visitors are coming from and which channels are driving the most traffic.</p>

        {loading ? null : (
          <div className="analytics-source-chart">
            {sources.map((source, index) => (
              <div key={source.source} className="analytics-source-row">
                <div>
                  <div className="analytics-source-title">{source.source}</div>
                  <div className="analytics-source-meta">{source.count} visitors · {(source.share * 100).toFixed(0)}%</div>
                </div>
                <div className="analytics-bar" aria-hidden="true">
                  <div className="analytics-bar-fill" style={{ width: `${Math.max(3, source.share * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
