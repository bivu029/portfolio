import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` })
const weightOptions = ['400', '500', '600', '700', '800']
const styleOptions = ['normal', 'italic']

const SKILLS_STYLE_DEFAULTS = {
  section_title_size: 'clamp(2rem, 4vw, 2.8rem)',
  section_title_weight: '700',
  section_title_style: 'normal'
}

const EMPTY_SKILL = { category: '', name: '', desc: '', pct: 80, tags: [] }

export default function SkillsAdmin() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [editing, setEditing] = useState(null)   // skill being edited
  const [isNew, setIsNew] = useState(false)
  const [saved, setSaved] = useState('')
  const [style, setStyle] = useState(null)
  const [styleSaved, setStyleSaved] = useState(false)

  const load = () => fetch(`${API}/api/skills`).then(r => r.json()).then(setSkills)
  useEffect(() => {
    load()
    fetch(`${API}/api/skills-style`).then(r => r.ok ? r.json() : null).then(setStyle).catch(() => {})
  }, [])

  const startEdit = (skill) => { setEditing({ ...skill, tags: [...(skill.tags || [])] }); setIsNew(false) }
  const startNew = () => { setEditing({ ...EMPTY_SKILL, tags: [] }); setIsNew(true) }
  const cancel = () => setEditing(null)

  const save = async () => {
    if (isNew) {
      await fetch(`${API}/admin/skills`, { method: 'POST', headers: headers(), body: JSON.stringify(editing) })
      setSaved('created')
    } else {
      await fetch(`${API}/admin/skills/${editing.id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(editing) })
      setSaved('updated')
    }
    setTimeout(() => setSaved(''), 2000)
    setEditing(null); load()
  }

  const deleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return
    await fetch(`${API}/admin/skills/${id}`, { method: 'DELETE', headers: headers() })
    load()
  }

  const saveStyle = async () => {
    if (!style) return
    await fetch(`${API}/admin/skills-style`, { method: 'PUT', headers: headers(), body: JSON.stringify(style) })
    setStyleSaved(true)
    setTimeout(() => setStyleSaved(false), 2000)
  }

  const updateTag = (i, val) => {
    const tags = [...editing.tags]; tags[i] = val; setEditing({ ...editing, tags })
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">⚡ Skills & Tools</h1>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
          <button className="admin-btn-primary" onClick={startNew}>+ Add New Skill</button>
        </div>
      </div>
      {saved && <div className="admin-success">✅ Skill {saved} successfully!</div>}
      {styleSaved && <div className="admin-success">✅ Skill section style saved!</div>}

      <div className="admin-card">
        <h3 className="admin-card-title">Skills Section Styling</h3>
        <p className="admin-card-desc">Update section heading typography for the Skills section.</p>
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
          <button className="admin-btn-ghost" onClick={() => setStyle(SKILLS_STYLE_DEFAULTS)}>Reset style defaults</button>
          <button className="admin-btn-primary" onClick={saveStyle}>Save Skills Style</button>
        </div>
      </div>

      {/* Edit / Create Form */}
      {editing && (
        <div className="admin-card admin-form-card">
          <h3 className="admin-card-title">{isNew ? 'New Skill' : `Editing: ${editing.name}`}</h3>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Category (pill label)</label>
              <input type="text" placeholder="e.g. Core Platform" value={editing.category}
                onChange={e => setEditing({ ...editing, category: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Tool Name</label>
              <input type="text" placeholder="e.g. Microsoft Fabric" value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
          </div>
          <div className="admin-field">
            <label>Description</label>
            <textarea rows={3} value={editing.desc}
              onChange={e => setEditing({ ...editing, desc: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Proficiency: {editing.pct}%</label>
            <input type="range" min={0} max={100} value={editing.pct}
              onChange={e => setEditing({ ...editing, pct: Number(e.target.value) })} />
          </div>
          <div className="admin-field">
            <label>Tags (sub-labels shown on card)</label>
            {editing.tags.map((tag, i) => (
              <div key={i} className="admin-list-row" style={{ marginBottom: '0.5rem' }}>
                <input type="text" value={tag} onChange={e => updateTag(i, e.target.value)} />
                <button className="admin-btn-danger-sm" onClick={() => setEditing({ ...editing, tags: editing.tags.filter((_, idx) => idx !== i) })}>✕</button>
              </div>
            ))}
            <button className="admin-btn-ghost" onClick={() => setEditing({ ...editing, tags: [...editing.tags, ''] })}>+ Add Tag</button>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn-ghost" onClick={cancel}>Cancel</button>
            <button className="admin-btn-primary" onClick={save}>Save Skill</button>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr><th>Category</th><th>Name</th><th>Proficiency</th><th>Tags</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {skills.map(skill => (
              <tr key={skill.id}>
                <td><span className="admin-pill">{skill.category}</span></td>
                <td className="admin-table-name">{skill.name}</td>
                <td><span className="admin-pct">{skill.pct}%</span></td>
                <td className="admin-tags-cell">{(skill.tags || []).slice(0, 3).map((t, i) => <span key={i} className="admin-tag-sm">{t}</span>)}</td>
                <td>
                  <div className="admin-action-btns">
                    <button className="admin-btn-edit" onClick={() => startEdit(skill)}>✏️ Edit</button>
                    <button className="admin-btn-danger-sm" onClick={() => deleteSkill(skill.id)}>🗑</button>
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
