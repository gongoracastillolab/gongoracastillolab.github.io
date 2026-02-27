import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe } from 'lucide-react'

const baseUrl = import.meta.env.BASE_URL
const logo = `${baseUrl}logo_GClab.png`

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/research', label: t('nav.research') },
    { path: '/people', label: t('nav.people') },
    { path: '/publications', label: t('nav.publications') },
    { path: '/outreach', label: t('nav.outreach') },
  ]

  return (
    <header className="bg-white border-b border-border-gray sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-24 md:h-28">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <img 
              src={logo} 
              alt="Góngora-Castillo Lab Logo" 
              className="h-16 md:h-20 w-auto"
            />
            <div className="hidden md:block">
              <div className="font-serif text-xl md:text-2xl font-medium text-charcoal-blue group-hover:text-cobalt-blue transition-colors">
                {t('nav.title')}
              </div>
              <div className="text-sm md:text-base text-charcoal-blue/60 mt-0.0 max-w-[300px] leading-tight">
                {t('nav.subtitle')}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-sans text-base font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-cobalt-blue border-b-2 border-cobalt-blue pb-1'
                    : 'text-charcoal-blue hover:text-cobalt-blue'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-charcoal-blue hover:text-cobalt-blue transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="text-charcoal-blue hover:text-cobalt-blue transition-colors"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-charcoal-blue hover:text-cobalt-blue transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border-gray">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-sans text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-cobalt-blue'
                      : 'text-charcoal-blue hover:text-cobalt-blue'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
