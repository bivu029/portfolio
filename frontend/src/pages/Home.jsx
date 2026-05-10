import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStoredParticleStyle, getStoredParticleIntensity, getStoredParallaxEnabled, getStoredMotionEnabled, getStoredMotionIntensity } from '../theme'
import Navbar from '../components/Navbar'
import { API } from '../api'

function useTyping(phrases) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!phrases || phrases.length === 0) return
    let pIdx = 0, cIdx = 0, deleting = false, timer
    function type() {
      const current = phrases[pIdx]
      if (!deleting) {
        setText(current.slice(0, ++cIdx))
        if (cIdx === current.length) { deleting = true; timer = setTimeout(type, 2000); return }
      } else {
        setText(current.slice(0, --cIdx))
        if (cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length }
      }
      timer = setTimeout(type, deleting ? 40 : 80)
    }
    type()
    return () => clearTimeout(timer)
  }, [phrases?.join()])
  return text
}

export default function Home() {
  const canvasRef = useRef(null)
  const heroContentRef = useRef(null)
  const heroPhotoRef = useRef(null)
  const [hero, setHero] = useState(null)
  const [about, setAbout] = useState(null)
  const [skills, setSkills] = useState(null)
  const [projects, setProjects] = useState(null)
  const [contact, setContact] = useState(null)
  const [skillsStyle, setSkillsStyle] = useState(null)
  const [projectsStyle, setProjectsStyle] = useState(null)
  const [particleStyle, setParticleStyle] = useState(() => getStoredParticleStyle())
  const [particleIntensity, setParticleIntensity] = useState(() => getStoredParticleIntensity())
  const [parallaxEnabled, setParallaxEnabled] = useState(() => getStoredParallaxEnabled())
  const [motionEnabled, setMotionEnabled] = useState(() => getStoredMotionEnabled())
  const [motionIntensity, setMotionIntensity] = useState(() => getStoredMotionIntensity())
  const typingText = useTyping(hero?.typing_phrases)

  const phoneNumbers = (contact?.phone_numbers || []).filter(phone => phone?.number?.trim())
  const socialLinks = (contact?.social_links || []).filter(link => link?.url?.trim())

  // Fetch all data from backend
  useEffect(() => {
    fetch(`${API}/api/hero`).then(r => r.json()).then(setHero)
    fetch(`${API}/api/about`).then(r => r.json()).then(setAbout)
    fetch(`${API}/api/skills`).then(r => r.json()).then(setSkills)
    fetch(`${API}/api/projects`).then(r => r.json()).then(setProjects)
    fetch(`${API}/api/contact`).then(r => r.json()).then(setContact)
    fetch(`${API}/api/skills-style`).then(r => r.ok ? r.json() : null).then(setSkillsStyle).catch(() => {})
    fetch(`${API}/api/projects-style`).then(r => r.ok ? r.json() : null).then(setProjectsStyle).catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`${API}/api/theme-settings`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return
        setParticleStyle(data.particle_style || 'default')
        setParticleIntensity(data.particle_intensity || 'lighter')
        setParallaxEnabled(data.parallax_enabled ?? true)
        setMotionEnabled(data.motion_enabled ?? true)
        setMotionIntensity(data.motion_intensity || 'soft')
      })
      .catch(() => {})
  }, [])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W, H, particles = [], animId

    const styleColors = {
      default: {
        light: { main: 'rgba(63,114,175,ALPHA)', accent: 'rgba(240,160,48,ALPHA)', line: 'rgba(63,114,175,0.14)' },
        dark: { main: 'rgba(180,210,255,ALPHA)', accent: 'rgba(255,220,180,ALPHA)', line: 'rgba(180,210,255,0.16)' }
      },
      glow: {
        light: { main: 'rgba(96,165,250,ALPHA)', accent: 'rgba(56,189,248,ALPHA)', line: 'rgba(96,165,250,0.16)' },
        dark: { main: 'rgba(200,240,255,ALPHA)', accent: 'rgba(180,255,230,ALPHA)', line: 'rgba(180,255,230,0.18)' }
      },
      soft: {
        light: { main: 'rgba(96,165,250,ALPHA)', accent: 'rgba(167,139,250,ALPHA)', line: 'rgba(96,165,250,0.12)' },
        dark: { main: 'rgba(220,230,255,ALPHA)', accent: 'rgba(200,220,255,ALPHA)', line: 'rgba(220,230,255,0.14)' }
      },
      starfield: {
        light: { main: 'rgba(255,255,255,ALPHA)', accent: 'rgba(255,240,200,ALPHA)', line: 'rgba(255,255,255,0.12)' },
        dark: { main: 'rgba(255,255,255,ALPHA)', accent: 'rgba(200,230,255,ALPHA)', line: 'rgba(200,230,255,0.16)' }
      },
      nebula: {
        light: { main: 'rgba(168,85,247,ALPHA)', accent: 'rgba(59,130,246,ALPHA)', line: 'rgba(168,85,247,0.12)' },
        dark: { main: 'rgba(203,213,225,ALPHA)', accent: 'rgba(129,140,248,ALPHA)', line: 'rgba(203,213,225,0.14)' }
      },
      sparkle: {
        light: { main: 'rgba(245,158,11,ALPHA)', accent: 'rgba(34,197,94,ALPHA)', line: 'rgba(245,158,11,0.10)' },
        dark: { main: 'rgba(255,255,255,ALPHA)', accent: 'rgba(34,197,94,ALPHA)', line: 'rgba(255,255,255,0.12)' }
      }
    }

    function isDarkTheme() {
      return typeof document !== 'undefined' && /theme-dark-/.test(document.documentElement.className)
    }

    function getCurrentColors() {
      const colors = styleColors[particleStyle] || styleColors.default
      return isDarkTheme() ? colors.dark : colors.light
    }

    const intensityConfig = {
      'very lighter': { count: 90, alphaMin: 0.06, alphaMax: 0.16, connectDist: 100 },
      'lighter': { count: 130, alphaMin: 0.10, alphaMax: 0.22, connectDist: 120 },
      dark: { count: 180, alphaMin: 0.16, alphaMax: 0.34, connectDist: 140 }
    }
    const { count: particleCount, alphaMin, alphaMax, connectDist } = intensityConfig[particleIntensity] || intensityConfig.lighter

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      reset() {
        this.x = Math.random() * W; this.y = Math.random() * H
        this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5
        this.r = Math.random() * 2.2 + 0.6
        this.alpha = Math.random() * (alphaMax - alphaMin) + alphaMin
        this.accent = Math.random() < 0.22
      }
      constructor() { this.reset() }
      update() {
        this.x += this.vx; this.y += this.vy
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset()
      }
      draw(chosen) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        ctx.fillStyle = this.accent ? chosen.accent.replace('ALPHA', this.alpha) : chosen.main.replace('ALPHA', this.alpha)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle())

    function drawConnections(chosen) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectDist) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = chosen.line.replace('ALPHA', (1 - dist / connectDist).toFixed(2))
            ctx.lineWidth = 0.55
            ctx.stroke()
          }
        }
      }
    }

    function animate() {
      const chosen = getCurrentColors()
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => { p.update(); p.draw(chosen) })
      drawConnections(chosen)
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [particleStyle, particleIntensity])

  // Hero parallax motion
  useEffect(() => {
    if (!parallaxEnabled) return
    const heroPhoto = heroPhotoRef.current
    const heroContent = heroContentRef.current
    const intensity = motionIntensity === 'strong' ? 0.035 : 0.018
    const photoOffset = intensity * 0.65

    const handleMove = (event) => {
      const x = (event.clientX - window.innerWidth / 2) * intensity
      const y = (event.clientY - window.innerHeight / 2) * intensity
      if (heroContent) heroContent.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (heroPhoto) heroPhoto.style.transform = `translate3d(${-x * photoOffset / intensity}px, ${-y * photoOffset / intensity}px, 0) rotate(${x * 0.22}deg)`
    }
    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      if (heroContent) heroContent.style.transform = ''
      if (heroPhoto) heroPhoto.style.transform = ''
    }
  }, [parallaxEnabled, motionIntensity])

  // Scroll fade-in observer
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          e.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%'
          })
        }
      })
    }, { threshold: 0.15 })

    document.querySelectorAll('.fade-in, .motion-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [hero, about, skills, projects, contact, motionEnabled])

  return (
    <>
      <canvas id="bg-canvas" ref={canvasRef} />
      <Navbar />

      {/* ── Hero ── */}
      <section id="hero">
        <div className="container">
          <div className="hero-grid">
            {hero ? (
              <>
                <div ref={heroContentRef} className={`hero-copy${motionEnabled ? ' motion-item motion-left' : ''}`}>
                  {hero.available && (
                    <div className="hero-tag">{hero.availability_text}</div>
                  )}
                  <h1 className="hero-name" style={{ fontSize: hero.hero_title_size || 'clamp(3rem, 5vw, 4.5rem)', fontWeight: hero.hero_title_weight || '700', fontStyle: hero.hero_title_style || 'normal' }}>
                    {hero.name?.split('\n').map((line, i, arr) => (
                      <span key={i}>{i === arr.length - 1 ? <span style={{color:'var(--accent)'}}>{line}</span> : line}<br /></span>
                    ))}
                  </h1>
                  <div className="hero-typing-wrap">
                    <span id="typing-text" style={{ fontSize: hero.typing_size || '1.3rem', fontWeight: hero.typing_weight || '500', fontStyle: hero.typing_style || 'normal' }}>{typingText}</span>
                  </div>
                  <p className="hero-desc" style={{ fontSize: hero.hero_subtitle_size || '1.05rem', fontWeight: hero.hero_subtitle_weight || '400', fontStyle: hero.hero_subtitle_style || 'normal' }}>{hero.subtitle}</p>
                  <div className="hero-btns">
                    <a href="#projects" className="btn btn-primary">View Projects →</a>
                    <a href="#contact" className="btn btn-ghost">Get in Touch</a>
                  </div>
                  <div className="hero-stats">
                    {(hero.stats || []).map((stat, i) => (
                      <div key={i}>
                        <div className="stat-num" style={{ fontSize: hero.stat_num_size || '2rem', fontWeight: hero.stat_num_weight || '700', fontStyle: hero.stat_num_style || 'normal' }}>{stat.num}</div>
                        <div className="stat-label" style={{ fontSize: hero.stat_label_size || '0.9rem', fontWeight: hero.stat_label_weight || '400', fontStyle: hero.stat_label_style || 'normal' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div ref={heroPhotoRef} className={`hero-photo${motionEnabled ? ' motion-item motion-right' : ''}`} style={{ aspectRatio: hero.image_aspect || '3 / 4' }}>
                  {hero.image ? (
                    <img src={hero.image} alt="Hero" loading="lazy" />
                  ) : (
                    <div className="hero-photo-placeholder" style={{ width: '100%', height: '100%' }}>
                      <span style={{ fontSize: '3rem' }}>👤</span>
                      <span>Add your photo here</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hero-skeleton-grid">
                <div className="hero-copy-skeleton">
                  <div className="shimmer shimmer-tag" style={{ width: '14rem', height: '1.5rem', marginBottom: '1rem' }} />
                  <div className="shimmer shimmer-line" style={{ width: '100%', height: '3rem', marginBottom: '0.8rem' }} />
                  <div className="shimmer shimmer-line" style={{ width: '80%', height: '3rem', marginBottom: '0.8rem' }} />
                  <div className="shimmer shimmer-line" style={{ width: '85%', height: '1.4rem', marginBottom: '1.2rem' }} />
                  <div className="hero-btns" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="shimmer shimmer-btn" style={{ width: '11rem', height: '3rem' }} />
                    <div className="shimmer shimmer-btn" style={{ width: '10rem', height: '3rem' }} />
                  </div>
                  <div className="hero-stats" style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <div className="shimmer shimmer-stat" style={{ width: '8rem', height: '4rem', borderRadius: '1rem' }} />
                    <div className="shimmer shimmer-stat" style={{ width: '8rem', height: '4rem', borderRadius: '1rem' }} />
                    <div className="shimmer shimmer-stat" style={{ width: '8rem', height: '4rem', borderRadius: '1rem' }} />
                  </div>
                </div>
                <div className="hero-photo-skeleton shimmer" style={{ aspectRatio: '3 / 4' }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about">
        <div className="container">
          <div className="section-tag">01 — About</div>
          <div className="section-title" style={{ fontSize: about?.section_title_size || 'clamp(2rem, 4vw, 2.8rem)', fontWeight: about?.section_title_weight || '700', fontStyle: about?.section_title_style || 'normal' }}>Who I Am</div>
          <div className="about-grid">
            {about ? (
              <>
                <div className={`about-content fade-in${motionEnabled ? ' motion-item motion-left' : ''}`}>
                  {(about.paragraphs || []).map((para, i) => (
                    <p key={i} style={{ fontSize: about.paragraph_size || '1rem', fontWeight: about.paragraph_weight || '400', fontStyle: about.paragraph_style || 'normal' }}>{para}</p>
                  ))}
                </div>
                <div className={`about-cards fade-in${motionEnabled ? ' motion-item motion-right' : ''}`}>
                  {(about.info_cards || []).map((card, i) => (
                    <div key={i} className="info-card">
                      <div className="info-card-icon">{card.icon}</div>
                      <div className="info-card-label">{card.label}</div>
                      <div className="info-card-value">{card.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={`about-content fade-in${motionEnabled ? ' motion-item motion-left' : ''}`}>
                  <div className="shimmer shimmer-line" style={{ width: '100%', height: '1.25rem', marginBottom: '0.9rem' }} />
                  <div className="shimmer shimmer-line" style={{ width: '95%', height: '1.25rem', marginBottom: '0.9rem' }} />
                  <div className="shimmer shimmer-line" style={{ width: '85%', height: '1.25rem', marginBottom: '0.9rem' }} />
                  <div className="shimmer shimmer-line" style={{ width: '90%', height: '1.25rem', marginBottom: '0.9rem' }} />
                </div>
                <div className={`about-cards fade-in${motionEnabled ? ' motion-item motion-right' : ''}`}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="info-card shimmer" style={{ minHeight: '7rem' }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills">
        <div className="container">
          <div className="section-tag">02 — Skills</div>
          <div className="section-title" style={{ fontSize: skillsStyle?.section_title_size || 'clamp(2rem, 4vw, 2.8rem)', fontWeight: skillsStyle?.section_title_weight || '700', fontStyle: skillsStyle?.section_title_style || 'normal' }}>Tools & Technologies</div>
          <div className="section-line"></div>
          <div className="skills-card-grid">
            {skills === null ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="skill-card shimmer" style={{ minHeight: '18rem' }} />
              ))
            ) : (
              skills.map((skill, i) => (
                <div key={skill.id || i} className={`skill-card fade-in${i > 0 ? ` fade-in-delay-${Math.min(i,3)}` : ''}${motionEnabled ? ' motion-item motion-up' : ''}`}>
                  <div className="skill-card-category">
                    <span className="skill-cat-dot">○</span> {skill.category}
                  </div>
                  <div className="skill-card-name">{skill.name}</div>
                  <p className="skill-card-desc">{skill.desc}</p>
                  <div className="skill-card-proficiency">
                    <span>Proficiency</span>
                    <span className="skill-card-pct">{skill.pct}%</span>
                  </div>
                  <div className="skill-bar">
                    <div className="skill-bar-fill" data-width={skill.pct}></div>
                  </div>
                  <div className="skill-card-tags">
                    {(skill.tags || []).map((tag, j) => <span key={j} className="skill-tag">{tag}</span>)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section id="projects">
        <div className="container">
          <div className="section-tag">03 — Projects</div>
          <div className="section-title" style={{ fontSize: projectsStyle?.section_title_size || 'clamp(2rem, 4vw, 2.8rem)', fontWeight: projectsStyle?.section_title_weight || '700', fontStyle: projectsStyle?.section_title_style || 'normal' }}>Selected Projects</div>
          <div className="section-line"></div>
          <div className="projects-grid">
            {projects === null ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="project-card shimmer" style={{ minHeight: '14rem' }} />
              ))
            ) : (
              projects.map((p, i) => (
                <div key={p.id} className={`project-card fade-in${i > 0 ? ` fade-in-delay-${Math.min(i, 3)}` : ''}${motionEnabled ? ' motion-item motion-up' : ''}`}>
                  <div className="project-num">{p.num}</div>
                  <div className="project-name">{p.name}</div>
                  <div className="project-desc">{p.desc}</div>
                  <div className="project-stack">
                    {(p.stack || []).map((label, j) => (
                      <span key={j} className="stack-chip-outline">{label}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                    <Link to={`/case-study/${p.id}`} className="btn btn-project">View case study →</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact">
        <div className="container">
          <div className="section-tag">04 — Contact</div>
          <div className="section-title" style={{ fontSize: contact?.section_title_size || 'clamp(2rem, 4vw, 2.8rem)', fontWeight: contact?.section_title_weight || '700', fontStyle: contact?.section_title_style || 'normal' }}>Let's Build Something</div>
          <div className="section-line" style={{ margin: '0 auto 3rem' }}></div>
          {contact ? (
            <div className={`contact-box fade-in${motionEnabled ? ' motion-item motion-up' : ''}`}>
              <p style={{ fontSize: contact.description_size || '1.05rem', fontWeight: contact.description_weight || '400', fontStyle: contact.description_style || 'normal' }}>{contact.description || 'Open to full-time roles, freelance projects, and consulting. Let\'s connect.'}</p>
              <div className="contact-email" style={{ fontSize: contact.email_size || '1.2rem', fontWeight: contact.email_weight || '600', fontStyle: contact.email_style || 'normal' }}>{contact.email || 'bivasmanna4@gmail.com'}</div>
              {phoneNumbers.length > 0 && (
                <div className="contact-phone-row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '1.75rem' }}>
                  {phoneNumbers.map((phone, i) => (
                    <div key={phone.id || i} style={{ minWidth: '180px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.35rem' }}>{phone.label}</div>
                      <a href={`tel:${phone.number}`} style={{ fontWeight: 600, color: 'var(--accent)' }}>{phone.number}</a>
                    </div>
                  ))}
                </div>
              )}
              <div className="hero-btns" style={{ justifyContent: 'center' }}>
                <a href={`mailto:${contact.email || 'bivasmanna4@gmail.com'}`} className="btn btn-primary">Send Email →</a>
                {contact.cv_link && (
                  <a href={contact.cv_link} target="_blank" rel="noreferrer" className="btn btn-ghost">Download CV</a>
                )}
              </div>
              {socialLinks.length > 0 && (
                <div className="social-row" style={{ marginTop: '1.75rem' }}>
                  {socialLinks.map((link, i) => (
                    <a key={link.id || i} href={link.url} target="_blank" rel="noreferrer" className="social-btn">{link.label}</a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="contact-box shimmer" style={{ minHeight: '14rem' }} />
          )}
        </div>
      </section>

      <footer>
        <div className="container">Designed & Built by Bivas Manna · {new Date().getFullYear()}</div>
      </footer>
    </>
  )
}
