import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

const API = 'http://localhost:8000'

export default function CaseStudy() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [hero, setHero] = useState(null)
  const [projectsStyle, setProjectsStyle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    fetch(`${API}/api/projects/${projectId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProject(data); setSlideIndex(0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    fetch(`${API}/api/hero`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setHero(data))
      .catch(() => {})

    fetch(`${API}/api/projects-style`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setProjectsStyle(data))
      .catch(() => {})
  }, [])

  if (loading) return (
    <>
      <Navbar />
      <section className="container" style={{ padding: '8rem 0' }}>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </section>
    </>
  )

  if (!project) return (
    <>
      <Navbar />
      <section className="container" style={{ padding: '8rem 0' }}>
        <div className="section-tag">Case Study</div>
        <div className="section-title">Project Not Found</div>
        <div className="section-line"></div>
        <Link to="/" className="btn btn-ghost">← Back to portfolio</Link>
      </section>
    </>
  )

  return (
    <>
      <Navbar />
      <section className="container" style={{ padding: '8rem 0' }}>
        <div className="section-tag">Case Study</div>
        <div className="section-title" style={{ fontSize: projectsStyle?.section_title_size || hero?.section_title_size || 'clamp(2rem, 4vw, 2.8rem)', fontWeight: projectsStyle?.section_title_weight || hero?.section_title_weight || '700', fontStyle: projectsStyle?.section_title_style || hero?.section_title_style || 'normal' }}>{project.name}</div>
        <div className="section-line"></div>
        <p className="section-note">{project.overview}</p>
        <div className="case-study-actions">
          <Link to="/" className="btn btn-ghost">← Back to portfolio</Link>
          {project.live_link_active && project.live_link && (
            <a href={project.live_link} target="_blank" rel="noreferrer" className="btn btn-primary">Visit live project</a>
          )}
        </div>

        <div className="case-study-card">
          {project.slider_active && (project.slider_images || []).length > 0 && (
            <div className="case-study-slider">
              <button className="slider-nav" onClick={() => setSlideIndex((slideIndex - 1 + project.slider_images.length) % project.slider_images.length)}>&lsaquo;</button>
              <img src={project.slider_images[slideIndex]} alt={`Slide ${slideIndex + 1}`} className="case-study-slide" style={{ aspectRatio: project.slider_aspect || '16 / 9' }} />
              <button className="slider-nav" onClick={() => setSlideIndex((slideIndex + 1) % project.slider_images.length)}>&rsaquo;</button>
            </div>
          )}
          <div className="case-study-top">
            <div>
              <div className="meta-pair"><span>Business Impact</span><span>{project.impact}</span></div>
              <div className="meta-pair"><span>Tools & Technologies</span><span>{project.tools}</span></div>
              <p className="case-study-overview">{project.overview}</p>
            </div>
            <div className="case-study-meta">
              <div className="case-study-section">
                <h3>Problem Statement</h3>
                <p>{project.problem}</p>
              </div>
              <div className="case-study-section">
                <h3>Data Overview</h3>
                <p>{project.data}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="case-study-section">
              <h3>Architecture</h3>
              <p>{project.architecture}</p>
            </div>
            <div className="case-study-section">
              <h3>Tech Stack</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {(project.stack || []).map((t, i) => <span key={i} className="stack-chip-outline">{t}</span>)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="case-study-section">
              <h3>Approach</h3>
              <ul>{(project.approach || []).map((step, i) => <li key={i}>{step}</li>)}</ul>
            </div>
            <div className="case-study-section">
              <h3>Key Insights</h3>
              <ul>{(project.insights || []).map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>
      <footer>
        <div className="container">Designed & Built by Bivas Manna · {new Date().getFullYear()}</div>
      </footer>
    </>
  )
}
