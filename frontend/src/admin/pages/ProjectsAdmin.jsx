import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` })
const token = () => sessionStorage.getItem('admin_token')
const weightOptions = ['400', '500', '600', '700', '800']
const styleOptions = ['normal', 'italic']

const PROJECTS_STYLE_DEFAULTS = {
  section_title_size: 'clamp(2rem, 4vw, 2.8rem)',
  section_title_weight: '700',
  section_title_style: 'normal'
}

const EMPTY = {
  name: '', desc: '', stack: [],
  overview: '', problem: '', data: '', architecture: '',
  approach: [''], insights: [''], impact: '', tools: '',
  slider_active: false, slider_images: [], slider_aspect: '16 / 9',
  live_link_active: false, live_link: ''
}

export default function ProjectsAdmin() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [saved, setSaved] = useState('')
  const [style, setStyle] = useState(null)
  const [styleSaved, setStyleSaved] = useState(false)
  const [sliderFile, setSliderFile] = useState(null)
  const [sliderUploading, setSliderUploading] = useState(false)

  const load = () => fetch(`${API}/api/projects`).then(r => r.json()).then(setProjects)
  useEffect(() => {
    load()
    fetch(`${API}/api/projects-style`).then(r => r.ok ? r.json() : null).then(setStyle).catch(() => {})
  }, [])

  const startEdit = p => { setEditing({
    ...p,
    stack: [...(p.stack || [])],
    approach: [...(p.approach || [''])],
    insights: [...(p.insights || [''])],
    slider_active: !!p.slider_active,
    slider_images: [...(p.slider_images || [])],
    slider_aspect: p.slider_aspect || '16 / 9',
    live_link_active: !!p.live_link_active,
    live_link: p.live_link || ''
  }); setIsNew(false) }
  const startNew = () => { setEditing({ ...EMPTY }); setIsNew(true) }
  const cancel = () => setEditing(null)

  const save = async () => {
    const url = isNew ? `${API}/admin/projects` : `${API}/admin/projects/${editing.id}`
    const method = isNew ? 'POST' : 'PUT'
    const payload = {
      ...editing,
      slider_active: !!editing.slider_active,
      live_link_active: !!editing.live_link_active,
      slider_images: editing.slider_images || [],
      stack: editing.stack || [],
      approach: editing.approach || [],
      insights: editing.insights || []
    }

    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(payload) })
    if (!res.ok) {
      const err = await res.text()
      window.alert(`Save failed: ${err || res.statusText}`)
      return
    }

    setSaved(isNew ? 'created' : 'updated')
    setTimeout(() => setSaved(''), 2000)
    setEditing(null); load()
  }

  const uploadSliderImage = async () => {
    if (!sliderFile) return
    setSliderUploading(true)
    const form = new FormData()
    form.append('file', sliderFile)

    const res = await fetch(`${API}/admin/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: form
    })

    if (res.ok) {
      const json = await res.json()
      setEditing({ ...editing, slider_images: [...(editing.slider_images || []), json.url] })
      setSliderFile(null)
    } else {
      const err = await res.text()
      window.alert(`Slider image upload failed: ${err || res.statusText}`)
    }
    setSliderUploading(false)
  }

  const del = async id => {
    if (!window.confirm('Delete this project?')) return
    await fetch(`${API}/admin/projects/${id}`, { method: 'DELETE', headers: headers() })
    load()
  }

  const saveStyle = async () => {
    if (!style) return
    await fetch(`${API}/admin/projects-style`, { method: 'PUT', headers: headers(), body: JSON.stringify(style) })
    setStyleSaved(true)
    setTimeout(() => setStyleSaved(false), 2000)
  }

  const listUpdate = (field, i, val) => {
    const arr = [...editing[field]]; arr[i] = val; setEditing({ ...editing, [field]: arr })
  }
  const listAdd = field => setEditing({ ...editing, [field]: [...editing[field], ''] })
  const listRemove = (field, i) => setEditing({ ...editing, [field]: editing[field].filter((_, idx) => idx !== i) })

  const stackUpdate = (i, val) => { const s = [...editing.stack]; s[i] = val; setEditing({ ...editing, stack: s }) }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📁 Projects</h1>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
          <button className="admin-btn-primary" onClick={startNew}>+ Add New Project</button>
        </div>
      </div>
      {saved && <div className="admin-success">✅ Project {saved} successfully!</div>}
      {styleSaved && <div className="admin-success">✅ Project section style saved!</div>}

      <div className="admin-card">
        <h3 className="admin-card-title">Projects Section Styling</h3>
        <p className="admin-card-desc">Customize the projects section heading typography.</p>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Section Title Size</label>
            <input type="text" value={style?.section_title_size || 'clamp(2rem, 4vw, 2.8rem)'} onChange={e => setStyle({ ...style, section_title_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Section Title Weight</label>
            <select value={style?.section_title_weight || '700'} onChange={e => setStyle({ ...style, section_title_weight: e.target.value })}>
              {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Section Title Style</label>
            <select value={style?.section_title_style || 'normal'} onChange={e => setStyle({ ...style, section_title_style: e.target.value })}>
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-form-actions" style={{ justifyContent: 'space-between' }}>
          <button className="admin-btn-ghost" onClick={() => setStyle(PROJECTS_STYLE_DEFAULTS)}>Reset style defaults</button>
          <button className="admin-btn-primary" onClick={saveStyle}>Save Projects Style</button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="admin-card admin-form-card">
          <h3 className="admin-card-title">{isNew ? '📁 New Project' : `Editing: ${editing.name}`}</h3>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Project Name</label>
              <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Project ID (URL slug)</label>
              <input type="text" value={editing.id || ''} onChange={e => setEditing({ ...editing, id: e.target.value })}
                placeholder="e.g. loan-portfolio" />
            </div>
          </div>

          <div className="admin-field">
            <label>Short Description (shown on project card)</label>
            <textarea rows={2} value={editing.desc} onChange={e => setEditing({ ...editing, desc: e.target.value })} />
          </div>

          <div className="admin-field">
            <label>Tech Stack (chips on card)</label>
            {(editing.stack || []).map((s, i) => (
              <div key={i} className="admin-list-row" style={{ marginBottom: '0.5rem' }}>
                <input type="text" value={s} onChange={e => stackUpdate(i, e.target.value)} />
                <button className="admin-btn-danger-sm" onClick={() => setEditing({ ...editing, stack: editing.stack.filter((_, idx) => idx !== i) })}>✕</button>
              </div>
            ))}
            <button className="admin-btn-ghost" onClick={() => setEditing({ ...editing, stack: [...(editing.stack || []), ''] })}>+ Add Tool</button>
          </div>

          <div className="admin-section-divider">📄 Case Study Details</div>

          <div className="admin-field">
            <label>Overview</label>
            <textarea rows={2} value={editing.overview} onChange={e => setEditing({ ...editing, overview: e.target.value })} />
          </div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Problem Statement</label>
              <textarea rows={2} value={editing.problem} onChange={e => setEditing({ ...editing, problem: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Data Overview</label>
              <textarea rows={2} value={editing.data} onChange={e => setEditing({ ...editing, data: e.target.value })} />
            </div>
          </div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Architecture</label>
              <textarea rows={2} value={editing.architecture} onChange={e => setEditing({ ...editing, architecture: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Business Impact</label>
              <input type="text" value={editing.impact} onChange={e => setEditing({ ...editing, impact: e.target.value })} />
            </div>
          </div>
          <div className="admin-field">
            <label>Tools Used</label>
            <input type="text" value={editing.tools} onChange={e => setEditing({ ...editing, tools: e.target.value })} />
          </div>

          <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Project Slider</h3>
            <div className="admin-toggle-row">
              <span>Enable slider images</span>
              <label className="admin-toggle">
                <input type="checkbox" checked={editing.slider_active}
                  onChange={e => setEditing({ ...editing, slider_active: e.target.checked })} />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            {editing.slider_active && (
              <>
                {(editing.slider_images || []).length > 0 && (
                  <div className="admin-field" style={{ marginTop: '1rem' }}>
                    <label>Uploaded Slider Images</label>
                    {(editing.slider_images || []).map((img, i) => (
                      <div key={i} className="admin-list-row" style={{ alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <img src={img} alt={`Slide ${i + 1}`} style={{ width: 120, aspectRatio: editing.slider_aspect || '16 / 9', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                        <span style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.9rem' }}>{img}</span>
                        <button className="admin-btn-danger-sm" onClick={() => listRemove('slider_images', i)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="admin-field" style={{ maxWidth: '240px', marginTop: '1rem' }}>
                  <label>Slider Image Aspect Ratio</label>
                  <select value={editing.slider_aspect || '16 / 9'} onChange={e => setEditing({ ...editing, slider_aspect: e.target.value })}>
                    <option value="16 / 9">16 / 9</option>
                    <option value="3 / 4">3 / 4</option>
                    <option value="1 / 1">1 / 1</option>
                    <option value="4 / 3">4 / 3</option>
                  </select>
                </div>
                <div className="admin-field" style={{ alignItems: 'flex-start', marginTop: '1rem' }}>
                  <label>Upload Slider Image</label>
                  <input type="file" accept="image/*" onChange={e => setSliderFile(e.target.files?.[0] || null)} />
                  <button className="admin-btn-ghost" onClick={uploadSliderImage} disabled={sliderUploading || !sliderFile}>
                    {sliderUploading ? 'Uploading…' : '+ Upload Slider Image'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="admin-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 className="admin-card-title">Live Project Link</h3>
            <div className="admin-toggle-row">
              <span>Enable live project link</span>
              <label className="admin-toggle">
                <input type="checkbox" checked={editing.live_link_active}
                  onChange={e => setEditing({ ...editing, live_link_active: e.target.checked })} />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            {editing.live_link_active && (
              <div className="admin-field" style={{ marginTop: '1rem' }}>
                <label>Live Link URL</label>
                <input type="text" value={editing.live_link} onChange={e => setEditing({ ...editing, live_link: e.target.value })} />
                <p className="admin-field-hint">Example: https://your-project-live-url.com</p>
              </div>
            )}
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Approach Steps</label>
              {(editing.approach || []).map((s, i) => (
                <div key={i} className="admin-list-row" style={{ marginBottom: '0.5rem' }}>
                  <input type="text" value={s} onChange={e => listUpdate('approach', i, e.target.value)} />
                  <button className="admin-btn-danger-sm" onClick={() => listRemove('approach', i)}>✕</button>
                </div>
              ))}
              <button className="admin-btn-ghost" onClick={() => listAdd('approach')}>+ Add Step</button>
            </div>
            <div className="admin-field">
              <label>Key Insights</label>
              {(editing.insights || []).map((s, i) => (
                <div key={i} className="admin-list-row" style={{ marginBottom: '0.5rem' }}>
                  <input type="text" value={s} onChange={e => listUpdate('insights', i, e.target.value)} />
                  <button className="admin-btn-danger-sm" onClick={() => listRemove('insights', i)}>✕</button>
                </div>
              ))}
              <button className="admin-btn-ghost" onClick={() => listAdd('insights')}>+ Add Insight</button>
            </div>
          </div>

          <div className="admin-form-actions">
            <button className="admin-btn-ghost" onClick={cancel}>Cancel</button>
            <button className="admin-btn-primary" onClick={save}>Save Project</button>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr><th>Num</th><th>Name</th><th>Stack</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td><span className="admin-pill">{p.num}</span></td>
                <td className="admin-table-name">{p.name}</td>
                <td className="admin-tags-cell">{(p.stack || []).slice(0, 3).map((t, i) => <span key={i} className="admin-tag-sm">{t}</span>)}</td>
                <td>
                  <div className="admin-action-btns">
                    <button className="admin-btn-edit" onClick={() => startEdit(p)}>✏️ Edit</button>
                    <button className="admin-btn-danger-sm" onClick={() => del(p.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
