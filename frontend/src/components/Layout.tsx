import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../index.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div>
      <header className="site-header">
        <div className="nav">
          <Link to="/" className="logo">
            Notlar Burada
          </Link>

          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(open => !open)}
          >
            ☰
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <Link to="/login">Giriş</Link>
            <Link to="/register">Kayıt</Link>
          </nav>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  )
}
