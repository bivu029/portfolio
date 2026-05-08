import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('admin_token')}` })
const weightOptions = ['400', '500', '600', '700', '800']
const styleOptions = ['normal', 'italic']
const ABOUT_STYLE_DEFAULTS = {
  section_title_size: 'clamp(2rem, 4vw, 2.8rem)',
  section_title_weight: '700',
  section_title_style: 'normal',
  paragraph_size: '1rem',
  paragraph_weight: '400',
  paragraph_style: 'normal'
}

export default function AboutAdmin() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/about`).then(r => r.json()).then(setData)
  }, [])

  const save = async () => {
    await fetch(`${API}/admin/about`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const updatePara = (i, val) => {
    const paragraphs = [...data.paragraphs]; paragraphs[i] = val
    setData({ ...data, paragraphs })
  }
  const addPara = () => setData({ ...data, paragraphs: [...data.paragraphs, ''] })
  const removePara = i => setData({ ...data, paragraphs: data.paragraphs.filter((_, idx) => idx !== i) })

  const updateCard = (i, field, val) => {
    const info_cards = [...data.info_cards]; info_cards[i] = { ...info_cards[i], [field]: val }
    setData({ ...data, info_cards })
  }
  const addCard = () => setData({ ...data, info_cards: [...data.info_cards, { icon: '⭐', label: '', value: '' }] })
  const removeCard = i => setData({ ...data, info_cards: data.info_cards.filter((_, idx) => idx !== i) })

  if (!data) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">👤 About Section</h1>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Bio Paragraphs</h3>
        <p className="admin-card-desc">Each paragraph appears as a separate block in the About section.</p>
        {data.paragraphs.map((para, i) => (
          <div key={i} className="admin-list-row" style={{ alignItems: 'flex-start' }}>
            <textarea rows={3} value={para} onChange={e => updatePara(i, e.target.value)} style={{ flex: 1 }} />
            <button className="admin-btn-danger-sm" onClick={() => removePara(i)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-ghost" onClick={addPara}>+ Add Paragraph</button>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Info Cards</h3>
        <p className="admin-card-desc">The 4 cards on the right side of About (Location, Education, Role, etc.)</p>
        {data.info_cards.map((card, i) => (
          <div key={i} className="admin-info-card-row">
            <div className="admin-field" style={{ width: '60px' }}>
              <label>Icon</label>
              <input type="text" value={card.icon} onChange={e => updateCard(i, 'icon', e.target.value)} />
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label>Label</label>
              <input type="text" value={card.label} onChange={e => updateCard(i, 'label', e.target.value)} />
            </div>
            <div className="admin-field" style={{ flex: 2 }}>
              <label>Value</label>
              <input type="text" value={card.value} onChange={e => updateCard(i, 'value', e.target.value)} />
            </div>
            <button className="admin-btn-danger-sm" style={{ marginTop: '1.5rem' }} onClick={() => removeCard(i)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-ghost" onClick={addCard}>+ Add Card</button>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">About Section Styling</h3>
        <p className="admin-card-desc">Customize the About section heading and paragraph typography.</p>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Section Title Size</label>
            <input type="text" value={data.section_title_size || 'clamp(2rem, 4vw, 2.8rem)'} onChange={e => setData({ ...data, section_title_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Section Title Weight</label>
            <select value={data.section_title_weight || '700'} onChange={e => setData({ ...data, section_title_weight: e.target.value })}>
              {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Section Title Style</label>
            <select value={data.section_title_style || 'normal'} onChange={e => setData({ ...data, section_title_style: e.target.value })}>
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Paragraph Text Size</label>
            <input type="text" value={data.paragraph_size || '1rem'} onChange={e => setData({ ...data, paragraph_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Paragraph Weight</label>
            <select value={data.paragraph_weight || '400'} onChange={e => setData({ ...data, paragraph_weight: e.target.value })}>
              {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Paragraph Style</label>
            <select value={data.paragraph_style || 'normal'} onChange={e => setData({ ...data, paragraph_style: e.target.value })}>
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-form-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="admin-btn-ghost" onClick={() => setData({ ...data, ...ABOUT_STYLE_DEFAULTS })}>Reset style defaults</button>
        </div>
      </div>

      <div className="admin-page-footer">
        <button className="admin-btn-primary" onClick={save}>{saved ? '✅ Saved!' : 'Save Changes'}</button>
      </div>
    </div>
  )
}
