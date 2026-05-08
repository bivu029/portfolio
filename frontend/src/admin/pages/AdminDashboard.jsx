import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  { path: '/admin/hero', title: 'Hero Section', description: 'Update the homepage intro, headline, availability, and hero stats.' },
  { path: '/admin/about', title: 'About Section', description: 'Edit your bio paragraphs and info cards like location, education, and role.' },
  { path: '/admin/skills', title: 'Skills & Tools', description: 'Add, edit, and manage skills, proficiency, and tag labels.' },
  { path: '/admin/projects', title: 'Projects', description: 'Manage your case studies, cards, stack, and project details.' },
  { path: '/admin/contact', title: 'Contact Section', description: 'Update email, phone numbers, CV upload, and social contact links.' },
  { path: '/admin/design-theme', title: 'Design & Theme', description: 'Manage application appearance, theme toggles and styling options.' },
  { path: '/admin/credentials', title: 'Credentials', description: 'Change your admin username and password securely.' },
  { path: '/admin/analysis', title: 'Analytics', description: 'Monitor visitor traffic and source channels.' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="admin-page admin-dashboard-page">
      <div className="admin-dashboard-intro admin-dashboard-minimal">
        <p className="admin-dashboard-copy">Choose a section below to edit the hero, about, skills, and project content.</p>
      </div>

      <div className="admin-dashboard-grid admin-dashboard-grid-compact">
        {SECTIONS.map(section => (
          <button key={section.path} className="admin-dashboard-card" onClick={() => navigate(section.path)}>
            <div className="admin-dashboard-card-title">{section.title}</div>
            <div className="admin-dashboard-card-desc">{section.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
