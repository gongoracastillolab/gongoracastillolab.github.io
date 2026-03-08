import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Mail } from 'lucide-react'
import { BlueskyIcon, GoogleScholarIcon, GithubIcon } from './SocialIcons'
import { useLocalizedData } from '../hooks/useLocalizedData'
import { emailToDisplayText, emailToMailtoHref } from '../utils/emailDisplay'

const baseUrl = import.meta.env.BASE_URL
const logo = `${baseUrl}logo_GClab_B.png`
const cinvestavLogo = `${baseUrl}Cinvestav_MID_logo_blanco.svg`
const cinvestavMeridaUrl = 'https://www.cinvestav.mx/merida'
const recursosDelMarUrl = 'https://www.cinvestav.mx/merida/recursos-del-mar'
const piCinvestavProfileUrl = 'https://www.cinvestav.mx/mda/investigacion/directorio-de-investigacion/elsa-beatriz-g243ngora-castillo'

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
                <a
                  href={recursosDelMarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {t('footer.department')}
                </a>
              </p>
              <p className="text-sm text-white/60">{t('footer.location')}</p>
            </div>
          </div>

          {/* Logo Cinvestav + columnas de enlaces */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-x-10 lg:gap-x-12 gap-y-8 lg:gap-y-0">
            {/* Logo Cinvestav */}
            <div className="flex items-start">
              <a
                href={cinvestavMeridaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                aria-label="Cinvestav Unidad Mérida"
              >
                <img
                  src={cinvestavLogo}
                  alt="Cinvestav Unidad Mérida"
                  className="h-24 md:h-28 w-auto object-contain"
                />
              </a>
            </div>

            {/* Research, People y Outreach en una columna (misma jerarquía), espacio compacto */}
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="font-serif font-semibold text-white mb-2">
                  {t('nav.research')}
                </h3>
                <ul className="space-y-1 text-sm">
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
                </ul>
              </div>
              <div>
                <h3 className="font-serif font-semibold text-white mb-2">
                  {t('nav.people')}
                </h3>
                <ul className="space-y-1 text-sm">
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
            </div>

            {/* Outreach, Contact y Follow Us — Outreach primero, espacio compacto */}
            <div className="flex flex-col gap-2">
            <div>
              <h3 className="font-serif font-semibold text-white mb-2">
                {t('nav.outreach')}
              </h3>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link to="/outreach" className="text-white/80 hover:text-white transition-colors">
                    {t('footer.links.outreachPage')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif font-semibold text-white mb-2">
                {t('footer.contactTitle')}
              </h3>
              <div className="space-y-1 text-sm">
                {mailtoHref && (
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
                    <span>{emailDisplay}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
                <p>
                  <a
                    href={piCinvestavProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors"
                  >
                    {t('footer.piCinvestavProfile')}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-serif font-semibold text-white mb-0 leading-tight">
                {t('footer.followUs')}
              </h3>
              <ul className="flex flex-wrap items-center gap-3 mt-0 pt-0 list-none">
                <li>
                  <a
                    href="https://bsky.app/profile/gongoralab.bsky.social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors p-1 rounded"
                    aria-label="Bluesky"
                  >
                    <BlueskyIcon size={24} className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://scholar.google.com/citations?user=Rv6zyJ8AAAAJ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors p-1 rounded"
                    aria-label="Google Scholar"
                  >
                    <GoogleScholarIcon size={24} className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/gongoracastillolab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors p-1 rounded"
                    aria-label="GitHub"
                  >
                    <GithubIcon size={24} className="w-6 h-6" />
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
