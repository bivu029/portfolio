import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'
const token = () => sessionStorage.getItem('admin_token')
const headers = () => {
  const authToken = token()
  const headerObj = { 'Content-Type': 'application/json' }
  if (authToken) headerObj.Authorization = `Bearer ${authToken}`
  return headerObj
}
const CONTACT_STYLE_DEFAULTS = {
  section_title_size: 'clamp(2rem, 4vw, 2.8rem)',
  section_title_weight: '700',
  section_title_style: 'normal',
  description_size: '1.05rem',
  description_weight: '400',
  description_style: 'normal',
  email_size: '1.2rem',
  email_weight: '600',
  email_style: 'normal'
}
const EMPTY_CONTACT = {
  email: '',
  description: '',
  cv_link: '',
  phone_numbers: [],
  social_links: []
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function ContactAdmin() {
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    fetch(`${API}/admin/contact`, { headers: headers() })
      .then(async r => {
        if (!r.ok) {
          const errorText = await r.text()
          throw new Error(errorText || 'Failed to load contact')
        }
        return r.json()
      })
      .then(data => setContact(data || EMPTY_CONTACT))
      .catch(error => {
        console.error('Contact load failed', error)
        setContact(EMPTY_CONTACT)
      })
  }, [])

  const save = async () => {
    if (!token()) {
      window.alert('Admin token missing. Please log in again and retry saving.')
      return
    }

    const sanitized = {
      ...contact,
      phone_numbers: (contact.phone_numbers || []).filter(phone => phone?.number?.trim()),
      social_links: (contact.social_links || []).filter(link => link?.url?.trim())
    }

    const res = await fetch(`${API}/admin/contact`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(sanitized)
    })

    if (!res.ok) {
      const errorText = await res.text()
      window.alert(`Contact save failed: ${errorText || res.statusText}`)
      return
    }

    setContact(sanitized)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const uploadCv = async () => {
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`${API}/admin/contact/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: form
    })
    const data = await res.json()
    if (data.url) {
      setContact({ ...contact, cv_link: data.url })
    }
    setUploading(false)
  }

  const updatePhone = (index, field, value) => {
    const list = [...(contact.phone_numbers || [])]
    list[index] = { ...list[index], [field]: value }
    setContact({ ...contact, phone_numbers: list })
  }

  const updateSocial = (index, field, value) => {
    const list = [...(contact.social_links || [])]
    list[index] = { ...list[index], [field]: value }
    setContact({ ...contact, social_links: list })
  }

  const addPhone = () => setContact({ ...contact, phone_numbers: [...(contact.phone_numbers || []), { id: makeId(), label: 'Mobile', number: '' }] })
  const removePhone = index => setContact({ ...contact, phone_numbers: (contact.phone_numbers || []).filter((_, i) => i !== index) })
  const addSocial = () => setContact({ ...contact, social_links: [...(contact.social_links || []), { id: makeId(), label: 'LinkedIn', url: '' }] })
  const removeSocial = index => setContact({ ...contact, social_links: (contact.social_links || []).filter((_, i) => i !== index) })

  if (!contact) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">📬 Contact Section</h1>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Primary Contact Info</h3>
        <p className="admin-card-desc">Update the email address and message shown in the contact section.</p>
        <div className="admin-field">
          <label>Email Address</label>
          <input type="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
        </div>
        <div className="admin-field">
          <label>Contact Description</label>
          <textarea rows={3} value={contact.description} onChange={e => setContact({ ...contact, description: e.target.value })} />
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">CV / Resume</h3>
        <p className="admin-card-desc">Upload a single CV file. Existing CVs can be deleted and replaced with a new upload.</p>
        <div className="admin-field" style={{ alignItems: 'flex-start' }}>
          <label>Upload CV File</label>
          <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button className="admin-btn-ghost" onClick={uploadCv} disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload CV'}
          </button>
        </div>
        {contact.cv_link && (
          <div className="admin-field" style={{ marginTop: '0.5rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label>Current CV</label>
            <a href={contact.cv_link} target="_blank" rel="noreferrer">Download current CV</a>
            <button className="admin-btn-danger-sm" onClick={() => setContact({ ...contact, cv_link: '' })}>Delete CV</button>
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Contact Section Styling</h3>
        <p className="admin-card-desc">Customize Contact section typography and spacing.</p>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Section Title Size</label>
            <input type="text" value={contact.section_title_size || 'clamp(2rem, 4vw, 2.8rem)'} onChange={e => setContact({ ...contact, section_title_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Section Title Weight</label>
            <select value={contact.section_title_weight || '700'} onChange={e => setContact({ ...contact, section_title_weight: e.target.value })}>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Section Title Style</label>
            <select value={contact.section_title_style || 'normal'} onChange={e => setContact({ ...contact, section_title_style: e.target.value })}>
              <option value="normal">normal</option>
              <option value="italic">italic</option>
            </select>
          </div>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Description Size</label>
            <input type="text" value={contact.description_size || '1.05rem'} onChange={e => setContact({ ...contact, description_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Description Weight</label>
            <select value={contact.description_weight || '400'} onChange={e => setContact({ ...contact, description_weight: e.target.value })}>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Description Style</label>
            <select value={contact.description_style || 'normal'} onChange={e => setContact({ ...contact, description_style: e.target.value })}>
              <option value="normal">normal</option>
              <option value="italic">italic</option>
            </select>
          </div>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Email Size</label>
            <input type="text" value={contact.email_size || '1.2rem'} onChange={e => setContact({ ...contact, email_size: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Email Weight</label>
            <select value={contact.email_weight || '600'} onChange={e => setContact({ ...contact, email_weight: e.target.value })}>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Email Style</label>
            <select value={contact.email_style || 'normal'} onChange={e => setContact({ ...contact, email_style: e.target.value })}>
              <option value="normal">normal</option>
              <option value="italic">italic</option>
            </select>
          </div>
        </div>
        <div className="admin-form-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="admin-btn-ghost" onClick={() => setContact({ ...contact, ...CONTACT_STYLE_DEFAULTS })}>Reset style defaults</button>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Phone Numbers</h3>
        <p className="admin-card-desc">Add one or more phone numbers to appear in the contact section.</p>
        {(contact.phone_numbers || []).map((phone, index) => (
          <div key={phone.id || index} className="admin-info-card-row">
            <div className="admin-field" style={{ flex: 1 }}>
              <label>Label</label>
              <input type="text" value={phone.label} onChange={e => updatePhone(index, 'label', e.target.value)} />
            </div>
            <div className="admin-field" style={{ flex: 2 }}>
              <label>Number</label>
              <input type="text" value={phone.number} onChange={e => updatePhone(index, 'number', e.target.value)} />
            </div>
            <button className="admin-btn-danger-sm" style={{ marginTop: '1.5rem' }} onClick={() => removePhone(index)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-ghost" onClick={addPhone}>+ Add Phone Number</button>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Social Links</h3>
        <p className="admin-card-desc">Add, edit, or remove LinkedIn, GitHub, and other contact links.</p>
        {(contact.social_links || []).map((link, index) => (
          <div key={link.id || index} className="admin-info-card-row">
            <div className="admin-field" style={{ flex: 1 }}>
              <label>Label</label>
              <input type="text" value={link.label} onChange={e => updateSocial(index, 'label', e.target.value)} />
            </div>
            <div className="admin-field" style={{ flex: 2 }}>
              <label>URL</label>
              <input type="text" value={link.url} onChange={e => updateSocial(index, 'url', e.target.value)} />
            </div>
            <button className="admin-btn-danger-sm" style={{ marginTop: '1.5rem' }} onClick={() => removeSocial(index)}>✕</button>
          </div>
        ))}
        <button className="admin-btn-ghost" onClick={addSocial}>+ Add Social Link</button>
      </div>

      <div className="admin-page-footer">
        <button className="admin-btn-primary" onClick={save}>{saved ? '✅ Saved!' : 'Save Changes'}</button>
      </div>
    </div>
  )
}
