import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import BlueskyFeed from '../components/BlueskyFeed'
import ChordDiagram from '../components/ChordDiagram'
import { useLocalizedData } from '../hooks/useLocalizedData'
import { emailToMailtoHref } from '../utils/emailDisplay'

const baseUrl = (import.meta as any).env.BASE_URL

export default function Home() {
  const { t, i18n } = useTranslation()
  const { home: content } = useLocalizedData()
  const mailtoHref = `mailto:${emailToMailtoHref(String(content.contactEmail ?? ''))}`
  const contactLinkWord = i18n.language.startsWith('en') ? 'here' : 'aquí'
  const contactTextWithLink = (() => {
    const text = String(content.contactText ?? '')
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const hrefSafe = mailtoHref.replace(/"/g, '&quot;')
    const regex = new RegExp(`\\b(${contactLinkWord})\\b`, 'gi')
    return escaped.replace(regex, `<a href="${hrefSafe}" class="text-cobalt-blue hover:text-hover-blue transition-colors font-medium underline underline-offset-2">$1</a>`)
  })()

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-white-smoke">
        {/* Background Animation Placeholder */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23004aad' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>

        {/* Immersive Centered Chord Diagram */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] z-0 overflow-visible opacity-40"> {/* Change opacity to 50% */}
          <ChordDiagram />
        </div>

        <div className="container-custom relative z-10 py-20 flex flex-col items-center text-center pointer-events-none">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl pointer-events-none"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl font-light text-charcoal-blue mb-10 leading-tight select-none">
              {String(content.title ?? '')}
            </h1>
            <div className="pointer-events-auto inline-block">
              <Link
                to="/research#proyectos"
                className="inline-flex items-center space-x-2 btn-primary"
              >
                <span>{t('home.cta')}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto space-y-6">
            {(String(content.description ?? '')).split(/\n\n+/).filter(Boolean).map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`leading-relaxed ${
                  i === 0
                    ? 'text-xl text-center font-bold text-cobalt-blue'
                    : 'text-lg text-charcoal-blue'
                }`}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-5 sm:py-5 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <p
              className="text-lg text-charcoal-blue mb-4 [&_a]:text-cobalt-blue [&_a]:hover:text-hover-blue [&_a]:transition-colors [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2"
              dangerouslySetInnerHTML={{ __html: contactTextWithLink }}
            />
            <div className="flex justify-center">
              <img
                src={`${baseUrl}cinvestav-unidad-merida-logo.png`}
                alt="Cinvestav Unidad Mérida"
                className="h-16 sm:h-40 w-auto object-contain"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bluesky Feed Section */}
      <BlueskyFeed />
    </div>
  )
}
