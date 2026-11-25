export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Resolve relative asset paths (e.g. /static/...) against the backend base URL.
// Absolute URLs are returned unchanged.
export function resolveAssetUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API}${url.startsWith('/') ? '' : '/'}${url}`
}
