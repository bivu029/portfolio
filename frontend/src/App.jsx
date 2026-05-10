import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import Home from './pages/Home'
import CaseStudy from './pages/CaseStudy'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import HeroAdmin from './admin/pages/HeroAdmin'
import AboutAdmin from './admin/pages/AboutAdmin'
import SkillsAdmin from './admin/pages/SkillsAdmin'
import ProjectsAdmin from './admin/pages/ProjectsAdmin'
import ContactAdmin from './admin/pages/ContactAdmin'
import DesignThemeAdmin from './admin/pages/DesignThemeAdmin'
import AnalyticsAdmin from './admin/pages/AnalyticsAdmin'
import CredentialsAdmin from './admin/pages/CredentialsAdmin'
import AdminDashboard from './admin/pages/AdminDashboard'

const API = import.meta.env.VITE_API_URL

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function getTrafficSource(referrer) {
  if (!referrer || referrer.includes(window.location.hostname)) {
    return 'Direct'
  }

  if (/google\.|bing\.|yahoo\./.test(referrer)) {
    return 'Organic Search'
  }
  if (/linkedin\.|facebook\.|twitter\.|instagram\.|t\.co/.test(referrer)) {
    return 'Social'
  }
  return 'Referral'
}

function RouteTracker() {
  const location = useLocation()
  const trackedOnce = useRef(false)

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      return
    }

    const isFirstView = !trackedOnce.current
    trackedOnce.current = true
    const source = isFirstView ? getTrafficSource(document.referrer) : 'Internal'

    fetch(`${API}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: location.pathname,
        source,
        referrer: document.referrer || ''
      })
    }).catch(() => {})
  }, [location.pathname])

  return null
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      className="scroll-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      ↑ Top
    </button>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouteTracker />
      <ScrollToTopButton />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/case-study/:projectId" element={<CaseStudy />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="hero" element={<HeroAdmin />} />
          <Route path="about" element={<AboutAdmin />} />
          <Route path="skills" element={<SkillsAdmin />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="contact" element={<ContactAdmin />} />
          <Route path="design-theme" element={<DesignThemeAdmin />} />
          <Route path="credentials" element={<CredentialsAdmin />} />
          <Route path="analysis" element={<AnalyticsAdmin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
