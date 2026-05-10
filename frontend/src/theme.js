const THEME_MODE_KEY = 'portfolio_theme_mode'
const LIGHT_PALETTE_KEY = 'portfolio_light_palette'
const DARK_PALETTE_KEY = 'portfolio_dark_palette'
const PAGE_TITLE_KEY = 'portfolio_page_title'
const PARTICLE_STYLE_KEY = 'portfolio_particle_style'
const PARTICLE_INTENSITY_KEY = 'portfolio_particle_intensity'
const PARALLAX_ENABLED_KEY = 'portfolio_parallax_enabled'
const MOTION_ENABLED_KEY = 'portfolio_motion_enabled'
const MOTION_INTENSITY_KEY = 'portfolio_motion_intensity'

export const THEME_MODES = ['system', 'light', 'dark']
export const LIGHT_PALETTES = ['blue', 'mint', 'lavender']
export const DARK_PALETTES = ['indigo', 'emerald', 'rose']
export const PARTICLE_STYLES = ['default', 'glow', 'soft', 'starfield', 'nebula', 'sparkle']
export const PARTICLE_INTENSITIES = ['very lighter', 'lighter', 'dark']
export const MOTION_INTENSITIES = ['soft', 'strong']

const getStored = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) || fallback
}

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const resolveThemeMode = (mode) => {
  if (mode === 'default') return 'system'
  if (mode === 'system') return 'system'
  if (mode === 'dark') return 'dark'
  return 'light'
}

const removeThemeClasses = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const classes = [
    'theme-system',
    'theme-default',
    ...LIGHT_PALETTES.map(p => `theme-light-${p}`),
    ...DARK_PALETTES.map(p => `theme-dark-${p}`)
  ]
  classes.forEach(cls => root.classList.remove(cls))
}

const getStoredBoolean = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const value = window.localStorage.getItem(key)
  return value === null ? fallback : value === 'true'
}

export const getStoredThemeMode = () => getStored(THEME_MODE_KEY, 'system')
export const getStoredLightPalette = () => getStored(LIGHT_PALETTE_KEY, 'blue')
export const getStoredDarkPalette = () => getStored(DARK_PALETTE_KEY, 'indigo')
export const getStoredPageTitle = () => getStored(PAGE_TITLE_KEY, 'Portfolio')
export const getStoredParticleStyle = () => getStored(PARTICLE_STYLE_KEY, 'default')
export const getStoredParticleIntensity = () => getStored(PARTICLE_INTENSITY_KEY, 'lighter')
export const getStoredParallaxEnabled = () => getStoredBoolean(PARALLAX_ENABLED_KEY, true)
export const getStoredMotionEnabled = () => getStoredBoolean(MOTION_ENABLED_KEY, true)
export const getStoredMotionIntensity = () => getStored(MOTION_INTENSITY_KEY, 'soft')

export const setStoredPageTitle = (title) => {
  if (typeof window === 'undefined') return
  const safeTitle = title?.trim() || 'Portfolio'
  window.localStorage.setItem(PAGE_TITLE_KEY, safeTitle)
  document.title = safeTitle
}

export const setStoredParticleStyle = (style) => {
  if (typeof window === 'undefined') return
  const safeStyle = PARTICLE_STYLES.includes(style) ? style : 'default'
  window.localStorage.setItem(PARTICLE_STYLE_KEY, safeStyle)
}

export const setStoredParallaxEnabled = (enabled) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PARALLAX_ENABLED_KEY, enabled ? 'true' : 'false')
}

export const setStoredMotionEnabled = (enabled) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MOTION_ENABLED_KEY, enabled ? 'true' : 'false')
}

export const setStoredParticleIntensity = (intensity) => {
  if (typeof window === 'undefined') return
  const safeIntensity = PARTICLE_INTENSITIES.includes(intensity) ? intensity : 'lighter'
  window.localStorage.setItem(PARTICLE_INTENSITY_KEY, safeIntensity)
}

export const setStoredMotionIntensity = (intensity) => {
  if (typeof window === 'undefined') return
  const safeIntensity = MOTION_INTENSITIES.includes(intensity) ? intensity : 'soft'
  window.localStorage.setItem(MOTION_INTENSITY_KEY, safeIntensity)
}

export const applyPageTitle = (title) => {
  if (typeof document === 'undefined') return
  const finalTitle = title?.trim() || getStoredPageTitle()
  window.localStorage.setItem(PAGE_TITLE_KEY, finalTitle)
  document.title = finalTitle
  return finalTitle
}

export const applyTheme = (mode, lightPalette, darkPalette) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const storedLight = lightPalette || getStoredLightPalette()
  const storedDark = darkPalette || getStoredDarkPalette()
  const resolvedMode = resolveThemeMode(mode)
  const effectiveMode = resolvedMode === 'system' ? getSystemTheme() : resolvedMode

  removeThemeClasses()
  if (effectiveMode === 'light') {
    root.classList.add(`theme-light-${storedLight}`)
  } else if (effectiveMode === 'dark') {
    root.classList.add(`theme-dark-${storedDark}`)
  }

  window.localStorage.setItem(THEME_MODE_KEY, resolvedMode)
  window.localStorage.setItem(LIGHT_PALETTE_KEY, storedLight)
  window.localStorage.setItem(DARK_PALETTE_KEY, storedDark)
}
