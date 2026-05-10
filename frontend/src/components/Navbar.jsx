import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { applyPageTitle, applyTheme, getStoredThemeMode, THEME_MODES } from '../theme'
import { API } from '../api'

export default function Navbar() {
  const [brand, setBrand] = useState('// portfolio.v1')
  const [style, setStyle] = useState({ color: 'var(--dark)', fontSize: '1.05rem', fontWeight: '700', fontStyle: 'normal' })
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = getStoredThemeMode()
    return THEME_MODES.includes(stored) ? stored : 'system'
  })
  const [systemTheme, setSystemTheme] = useState('light')

  useEffect(() => {
    if (theme) applyTheme(theme)
  }, [theme])

  useEffect(() => {
    fetch(`${API}/api/theme-settings`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return
        const stored = window.localStorage.getItem('portfolio_theme_mode')
        const themeMode = stored || data.theme_mode || 'system'
        setTheme(themeMode)
        applyTheme(themeMode, data.light_palette, data.dark_palette)
        applyPageTitle(data.page_title)
      })
      .catch(() => {})

    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemTheme(media.matches ? 'dark' : 'light')
    update()
    if (media.addEventListener) {
      media.addEventListener('change', update)
    } else {
      media.addListener(update)
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', update)
      } else {
        media.removeListener(update)
      }
    }
  }, [])

  useEffect(() => {
    fetch(`${API}/api/hero`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          const title = (data.nav_title || '').trim() || (data.name ? data.name.split('\n')[0].trim() : '')
          setBrand(title || '// portfolio.v1')
          setStyle({
            color: 'var(--dark)',
            fontSize: data.nav_title_size || '1.05rem',
            fontWeight: data.nav_title_weight || '700',
            fontStyle: data.nav_title_style || 'normal'
          })
        }
      })
      .catch(() => {})
  }, [])

  const toggleTheme = () => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')
  }

  const effectiveTheme = theme === 'system' ? systemTheme : theme
  const themeIcon = effectiveTheme === 'dark' ? '🌙' : '☀️'
  const themeLabel = theme === 'system' ? `Auto (${effectiveTheme})` : theme

  return (
    <>
      <nav>
        <div className="nav-inner">
          <Link to="/" className="nav-logo" style={style}>{brand}</Link>
          <ul className="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
      </nav>
      <button
        type="button"
        className="theme-toggle-float"
        onClick={toggleTheme}
        aria-label={`Switch theme mode, currently ${themeLabel}`}
      >
        <span>{themeIcon}</span>
      </button>
    </>
  )
}
