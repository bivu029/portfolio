import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'
const token = () => sessionStorage.getItem('admin_token')
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` })
const ratioOptions = ['3 / 4', '16 / 9', '1 / 1', '4 / 3']
const weightOptions = ['400', '500', '600', '700', '800']
const styleOptions = ['normal', 'italic']

const HERO_STYLE_DEFAULTS = {
  nav_title_size: '1.05rem',
  nav_title_weight: '700',
  nav_title_style: 'normal',
  hero_title_size: 'clamp(3rem, 5vw, 4.5rem)',
  hero_title_weight: '700',
  hero_title_style: 'normal',
  hero_subtitle_size: '1.05rem',
  hero_subtitle_weight: '400',
  hero_subtitle_style: 'normal',
  section_title_size: 'clamp(2rem, 4vw, 2.8rem)',
  section_title_weight: '700',
  section_title_style: 'normal'
}

export default function HeroAdmin() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [heroFile, setHeroFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/hero`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const save = async () => {
    await fetch(`${API}/admin/hero`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const uploadHeroImage = async () => {
    if (!heroFile) return
    setUploading(true)
    const form = new FormData()
    form.append('file', heroFile)

    const res = await fetch(`${API}/admin/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: form
    })

    if (res.ok) {
      const json = await res.json()
      setData({ ...data, image: json.url })
      setHeroFile(null)
    } else {
      const err = await res.text()
      window.alert(`Image upload failed: ${err || res.statusText}`)
    }
    setUploading(false)
  }

  const updateTyping = (i, val) => {
    const phrases = [...data.typing_phrases]
    phrases[i] = val
    setData({ ...data, typing_phrases: phrases })
  }

  const addPhrase = () => setData({ ...data, typing_phrases: [...data.typing_phrases, ''] })
  const removePhrase = i => setData({ ...data, typing_phrases: data.typing_phrases.filter((_, idx) => idx !== i) })

  const updateStat = (i, field, val) => {
    const stats = [...data.stats]
    stats[i] = { ...stats[i], [field]: val }
    setData({ ...data, stats })
  }

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">🏠 Hero Section</h1>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      {/* Availability */}
      <div className="admin-card">
        <h3 className="admin-card-title">Availability Status</h3>
        <div className="admin-toggle-row">
          <span>Show "Available for opportunities"</span>
          <label className="admin-toggle">
            <input type="checkbox" checked={data.available}
              onChange={e => setData({ ...data, available: e.target.checked })} />
            <span className="admin-toggle-slider"></span>
          </label>
        </div>
        <div className="admin-field" style={{ marginTop: '1rem' }}>
          <label>Badge Text</label>
          <input type="text" value={data.availability_text}
            onChange={e => setData({ ...data, availability_text: e.target.value })} />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Hero Image</h3>
        <p className="admin-card-desc">Upload a profile image for the hero section and choose an aspect ratio.</p>
        <div className="admin-field" style={{ alignItems: 'flex-start' }}>
          <label>Upload Hero Image</label>
          <input type="file" accept="image/*" onChange={e => setHeroFile(e.target.files?.[0] || null)} />
          <button className="admin-btn-ghost" onClick={uploadHeroImage} disabled={uploading || !heroFile}>
            {uploading ? 'Uploading…' : 'Upload Image'}
          </button>
        </div>
        <div className="admin-field" style={{ maxWidth: '240px' }}>
          <label>Hero Image Aspect Ratio</label>
          <select value={data.image_aspect || '3 / 4'} onChange={e => setData({ ...data, image_aspect: e.target.value })}>
            {ratioOptions.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
          </select>
        </div>
        {data.image && (
          <div className="admin-image-preview" style={{ aspectRatio: data.image_aspect || '3 / 4' }}>
            <img src={data.image} alt="Hero preview" />
            <button className="admin-btn-danger-sm" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setData({ ...data, image: '', image_aspect: '3 / 4' })}>Delete</button>
          </div>
        )}
      </div>

      {/* Name / Headline */}
      <div className="admin-card">
        <h3 className="admin-card-title">Visual Style</h3>
        <p className="admin-card-desc">Customize colors, font sizes, and styles for the navbar, hero text, and section headings.</p>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Navbar Title Size</label>
            <input type="text" value={data.nav_title_size || '1.05rem'} onChange={e => setData({ ...data, nav_title_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Navbar Title Weight</label>
            <select value={data.nav_title_weight || '700'} onChange={e => setData({ ...data, nav_title_weight: e.target.value })}>
              {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Navbar Title Style</label>
            <select value={data.nav_title_style || 'normal'} onChange={e => setData({ ...data, nav_title_style: e.target.value })}>
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Hero Title Size</label>
            <input type="text" value={data.hero_title_size || 'clamp(3rem, 5vw, 4.5rem)'} onChange={e => setData({ ...data, hero_title_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Hero Title Weight</label>
            <select value={data.hero_title_weight || '700'} onChange={e => setData({ ...data, hero_title_weight: e.target.value })}>
              {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Hero Title Style</label>
            <select value={data.hero_title_style || 'normal'} onChange={e => setData({ ...data, hero_title_style: e.target.value })}>
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Hero Subtitle Size</label>
            <input type="text" value={data.hero_subtitle_size || '1.05rem'} onChange={e => setData({ ...data, hero_subtitle_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Hero Subtitle Weight</label>
            <select value={data.hero_subtitle_weight || '400'} onChange={e => setData({ ...data, hero_subtitle_weight: e.target.value })}>
              {weightOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Hero Subtitle Style</label>
            <select value={data.hero_subtitle_style || 'normal'} onChange={e => setData({ ...data, hero_subtitle_style: e.target.value })}>
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
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
        <div className="admin-form-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="admin-btn-ghost" onClick={() => setData({ ...data, ...HERO_STYLE_DEFAULTS })}>Reset style defaults</button>
        </div>
      </div>
      <div className="admin-card">
        <h3 className="admin-card-title">Headline (Hero Title)</h3>
        <div className="admin-field">
          <label>Navbar Title</label>
          <input type="text" value={data.nav_title || ''}
            onChange={e => setData({ ...data, nav_title: e.target.value })} />
          <span className="admin-field-hint">This appears in the top navbar. Leave empty to use your hero name.</span>
        </div>
        <div className="admin-field">
          <label>Title Text (use \n for line break)</label>
          <input type="text" value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })} />
          <span className="admin-field-hint">e.g. "Data Analyst &\nFabric Engineer"</span>
        </div>
        <div className="admin-field">
          <label>Subtitle / Description</label>
          <textarea rows={4} value={data.subtitle}
            onChange={e => setData({ ...data, subtitle: e.target.value })} />
        </div>
      </div>

      {/* Typing phrases */}
      <div className="admin-card">
        <h3 className="admin-card-title">Typing Phrases</h3>
        <p className="admin-card-desc">These rotate in the animated typing effect on the hero.</p>
        {data.typing_phrases.map((phrase, i) => (
          <div key={i} className="admin-list-row">
            <input type="text" value={phrase} onChange={e => updateTyping(i, e.target.value)} />
            <button className="admin-btn-danger-sm" onClick={() => removePhrase(i)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-ghost" onClick={addPhrase}>+ Add Phrase</button>
      </div>

      {/* Stats */}
      <div className="admin-card">
        <h3 className="admin-card-title">Stats (Bottom of Hero)</h3>
        <div className="admin-stats-grid">
          {data.stats.map((stat, i) => (
            <div key={i} className="admin-stat-item">
              <div className="admin-field">
                <label>Number</label>
                <input type="text" value={stat.num} onChange={e => updateStat(i, 'num', e.target.value)} />
              </div>
              <div className="admin-field">
                <label>Label</label>
                <input type="text" value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-page-footer">
        <button className="admin-btn-primary" onClick={save}>{saved ? '✅ Saved!' : 'Save Changes'}</button>
      </div>
    </div>
  )
}
