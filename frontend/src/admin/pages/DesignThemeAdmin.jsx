import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applyTheme, applyPageTitle, getStoredPageTitle, setStoredPageTitle, getStoredParticleStyle, setStoredParticleStyle, getStoredParticleIntensity, setStoredParticleIntensity, getStoredThemeMode, getStoredLightPalette, getStoredDarkPalette, getStoredParallaxEnabled, getStoredMotionEnabled, getStoredMotionIntensity, setStoredParallaxEnabled, setStoredMotionEnabled, setStoredMotionIntensity, LIGHT_PALETTES, DARK_PALETTES, PARTICLE_STYLES, PARTICLE_INTENSITIES, MOTION_INTENSITIES, THEME_MODES } from '../../theme'

export default function DesignThemeAdmin() {
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState('default')
  const [lightPalette, setLightPalette] = useState(LIGHT_PALETTES[0])
  const [darkPalette, setDarkPalette] = useState(DARK_PALETTES[0])
  const [pageTitle, setPageTitle] = useState(getStoredPageTitle())
  const [particleStyle, setParticleStyle] = useState(getStoredParticleStyle())
  const [particleIntensity, setParticleIntensity] = useState(getStoredParticleIntensity())
  const [parallaxEnabled, setParallaxEnabled] = useState(getStoredParallaxEnabled())
  const [motionEnabled, setMotionEnabled] = useState(getStoredMotionEnabled())
  const [motionIntensity, setMotionIntensity] = useState(getStoredMotionIntensity())

  useEffect(() => {
    const storedMode = getStoredThemeMode()
    const storedLight = getStoredLightPalette()
    const storedDark = getStoredDarkPalette()
    const storedParticles = getStoredParticleStyle()
    const storedParticleIntensity = getStoredParticleIntensity()
    const storedParallax = getStoredParallaxEnabled()
    const storedMotion = getStoredMotionEnabled()
    const storedMotionIntensity = getStoredMotionIntensity()
    setThemeMode(storedMode)
    setLightPalette(storedLight)
    setDarkPalette(storedDark)
    setParticleStyle(storedParticles)
    setParticleIntensity(storedParticleIntensity)
    setParallaxEnabled(storedParallax)
    setMotionEnabled(storedMotion)
    setMotionIntensity(storedMotionIntensity)
    applyTheme(storedMode, storedLight, storedDark)
  }, [])

  const saveTheme = () => {
    applyTheme(themeMode, lightPalette, darkPalette)
    setStoredPageTitle(pageTitle)
    setStoredParticleStyle(particleStyle)
    setStoredParticleIntensity(particleIntensity)
    setStoredParallaxEnabled(parallaxEnabled)
    setStoredMotionEnabled(motionEnabled)
    setStoredMotionIntensity(motionIntensity)
    applyPageTitle()
    window.alert('Design settings saved. Refresh the home page to see updated motion and parallax preferences.')
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">🎨 Design & Theme</h1>
          <p className="admin-page-copy">Manage the app theme and color palette for light/dark modes.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn-ghost" onClick={() => navigate('/admin/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Theme Settings</h3>
        <p className="admin-card-desc">Choose the default theme mode and palettes used by the site.</p>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Browser Page Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={e => setPageTitle(e.target.value)}
              placeholder="Enter page title, e.g. BivasManna Portfolio"
            />
            <span className="admin-field-hint">This value appears in the browser tab title.</span>
          </div>
          <div className="admin-field">
            <label>Active Theme Mode</label>
            <select value={themeMode} onChange={e => setThemeMode(e.target.value)}>
              {THEME_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Light Palette</label>
            <select value={lightPalette} onChange={e => setLightPalette(e.target.value)}>
              {LIGHT_PALETTES.map(palette => <option key={palette} value={palette}>{palette}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Dark Palette</label>
            <select value={darkPalette} onChange={e => setDarkPalette(e.target.value)}>
              {DARK_PALETTES.map(palette => <option key={palette} value={palette}>{palette}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Background Particle Style</label>
            <select value={particleStyle} onChange={e => setParticleStyle(e.target.value)}>
              {PARTICLE_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
            </select>
            <span className="admin-field-hint">Choose the particle effect style used on the home background.</span>
          </div>
          <div className="admin-field">
            <label>Background Particle Intensity</label>
            <select value={particleIntensity} onChange={e => setParticleIntensity(e.target.value)}>
              {PARTICLE_INTENSITIES.map(intensity => <option key={intensity} value={intensity}>{intensity}</option>)}
            </select>
            <span className="admin-field-hint">Reduce or increase particle density and brightness to make the background easier to focus on.</span>
          </div>
          <div className="admin-field">
            <label>Enable Parallax Effect</label>
            <select value={parallaxEnabled ? 'true' : 'false'} onChange={e => setParallaxEnabled(e.target.value === 'true')}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <span className="admin-field-hint">Toggle subtle hero parallax movement on pointer motion.</span>
          </div>
          <div className="admin-field">
            <label>Enable Content Motion</label>
            <select value={motionEnabled ? 'true' : 'false'} onChange={e => setMotionEnabled(e.target.value === 'true')}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <span className="admin-field-hint">Toggle slide-in motion for hero text, images, cards and sections.</span>
          </div>
          <div className="admin-field">
            <label>Motion Intensity</label>
            <select value={motionIntensity} onChange={e => setMotionIntensity(e.target.value)}>
              {MOTION_INTENSITIES.map(intensity => (
                <option key={intensity} value={intensity}>{intensity}</option>
              ))}
            </select>
            <span className="admin-field-hint">Choose soft or strong motion for the hero and section animations.</span>
          </div>
        </div>
        <div className="admin-form-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="admin-btn-primary" onClick={saveTheme}>Save Theme Settings</button>
        </div>
      </div>
    </div>
  )
}
