import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Mail } from 'lucide-react'
import { useLocalizedData } from '../hooks/useLocalizedData'
import { emailToDisplayText, emailToMailtoHref } from '../utils/emailDisplay'

const baseUrl = import.meta.env.BASE_URL
const logo = `${baseUrl}logo_GClab_B.png`
const cinvestavMeridaUrl = 'https://www.cinvestav.mx/merida'

export default function Footer() {
  const { t } = useTranslation()
  const { home } = useLocalizedData()
  const contactEmail = String(home?.contactEmail ?? '')
  const mailtoHref = contactEmail ? `mailto:${emailToMailtoHref(contactEmail)}` : ''
  const emailDisplay = emailToDisplayText(contactEmail)

  return (
    <footer className="bg-charcoal-blue border-t border-border-gray mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-10 lg:gap-x-14 gap-y-10 items-start">
          {/* Logo (izquierda) y texto (derecha): más ancho en desktop para no cortar líneas */}
          <div className="flex flex-row items-start gap-5 md:gap-6 lg:col-span-2 lg:max-w-md">
            <img
              src={logo}
              alt="Góngora-Castillo Lab Logo"
              className="h-16 md:h-20 w-auto flex-shrink-0 mt-0.5"
            />
            <div className="space-y-2 min-w-0 flex-1 min-w-[10rem]">
              <div className="font-serif font-medium text-white">
                {t('footer.labName')}
              </div>
              <div className="text-sm text-white/80 leading-snug">
                {t('footer.fullName')}
              </div>
              <p className="text-sm text-white/70 leading-snug">
                <a
                  href={cinvestavMeridaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {t('footer.institution')}
                </a>
                <span className="text-white/50"> · </span>
                <span>{t('footer.department')}</span>
              </p>
              <p className="text-sm text-white/60">{t('footer.location')}</p>
            </div>
          </div>

          {/* Columnas de enlaces agrupadas: misma altura visual, alineadas al inicio */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-x-10 lg:gap-x-12 gap-y-8 lg:gap-y-0">
            {/* Research Links */}
            <div>
              <h3 className="font-serif font-semibold text-white mb-4">
                {t('nav.research')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/research" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.links.projects')}
                  </Link>
                </li>
                <li>
                  <Link to="/publications" className="text-white/80 hover:text-white transition-colors">
                    {t('nav.publications')}
                  </Link>
                </li>
                <li>
                  <Link to="/outreach" className="text-white/80 hover:text-white transition-colors">
                    {t('nav.outreach')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* People Links */}
            <div>
              <h3 className="font-serif font-semibold text-white mb-4">
                {t('nav.people')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/people" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.links.members')}
                  </Link>
                </li>
                <li>
                  <Link to="/people#alumni" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.links.alumni')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Follow Us */}
            <div className="space-y-6">
            <div>
              <h3 className="font-serif font-semibold text-white mb-4">
                {t('footer.contactTitle')}
              </h3>
              <p className="text-sm text-white/80 mb-2">{t('footer.contactIntro')}</p>
              {mailtoHref && (
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                  <span>{emailDisplay}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              )}
            </div>
            <div>
              <h3 className="font-serif font-semibold text-white mb-4">
                {t('footer.followUs')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://bsky.app/profile/gongoralab.bsky.social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Bluesky</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://scholar.google.com/citations?user=Rv6zyJ8AAAAJ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Google Scholar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-white/70">
          <p>{t('footer.copyright')}</p>
          <a
            href={cinvestavMeridaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white/90 transition-colors flex items-center gap-1"
          >
            {t('footer.partOf')}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}
