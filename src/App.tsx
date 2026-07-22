import { useEffect, useState } from 'react'
import './App.css'

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#work', label: 'Work' },
  { href: '#contact', label: 'Contact' },
]

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="site">
      <div className="grain" aria-hidden="true" />

      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <a className="nav__brand" href="#top" onClick={closeMenu}>
          Priya Badal
        </a>

        <button
          className={`nav__toggle ${menuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>

        <nav className={`nav__links ${menuOpen ? 'is-open' : ''}`} aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero__media" aria-hidden="true">
            <div className="hero__wash" />
            <img
              className="hero__image"
              src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=2400&q=80"
              alt=""
              width={2400}
              height={1600}
            />
          </div>

          <div className="hero__content">
            <p className="hero__brand reveal reveal--1">Priya Badal</p>
            <h1 className="hero__headline reveal reveal--2">
              A calm home for ideas, stories, and work in progress.
            </h1>
            <p className="hero__lede reveal reveal--3">
              This is the starting place — simple, personal, and ready to grow
              with whatever comes next.
            </p>
            <div className="hero__actions reveal reveal--4">
              <a className="btn btn--primary" href="#contact">
                Say hello
              </a>
              <a className="btn btn--ghost" href="#about">
                Meet Priya
              </a>
            </div>
          </div>
        </section>

        <section className="section about" id="about">
          <div className="section__inner">
            <p className="section__label">About</p>
            <h2 className="section__title">Hello — welcome in.</h2>
            <p className="section__copy">
              Priya Badal is building a small corner of the internet that feels
              like home: thoughtful writing, selected projects, and an easy way
              to stay in touch. The details will fill in as this space grows —
              for now, the door is open.
            </p>
          </div>
        </section>

        <section className="section work" id="work">
          <div className="section__inner">
            <p className="section__label">Work</p>
            <h2 className="section__title">What this space will hold.</h2>
            <p className="section__copy section__copy--narrow">
              A few rooms to expand over time — swap these for real projects,
              notes, or anything you want people to find first.
            </p>

            <ul className="focus-list">
              <li className="focus-list__item">
                <span className="focus-list__index">01</span>
                <div>
                  <h3>Projects</h3>
                  <p>
                    Featured work, case studies, and experiments worth sharing.
                  </p>
                </div>
              </li>
              <li className="focus-list__item">
                <span className="focus-list__index">02</span>
                <div>
                  <h3>Notes</h3>
                  <p>
                    Short reflections, process updates, and things learned along
                    the way.
                  </p>
                </div>
              </li>
              <li className="focus-list__item">
                <span className="focus-list__index">03</span>
                <div>
                  <h3>Life</h3>
                  <p>
                    Photos, rituals, and the quieter details that make a home
                    feel lived-in.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="section__inner contact__inner">
            <p className="section__label">Contact</p>
            <h2 className="section__title">Let&apos;s talk.</h2>
            <p className="section__copy">
              Have a question, idea, or just want to say hi? Reach out — this
              inbox is ready when you are.
            </p>
            <a className="btn btn--primary" href="mailto:hello@priyabadal.com">
              hello@priyabadal.com
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p className="footer__brand">Priya Badal</p>
        <p className="footer__meta">
          © {new Date().getFullYear()} · Built to grow
        </p>
      </footer>
    </div>
  )
}

export default App
