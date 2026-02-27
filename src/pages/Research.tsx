import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useLocalizedData } from '../hooks/useLocalizedData'

const baseUrl = (import.meta as any).env.BASE_URL
const PROJECTS_SECTION_ID = 'proyectos'

export default function Research() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash?.toLowerCase()
    if (hash === '#proyectos' || hash === '#projects') {
      const el = document.getElementById(PROJECTS_SECTION_ID)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])
  const { t } = useTranslation()
  const { research: historyContent, projects } = useLocalizedData()

  // Default gradients to alternate between if no image is available
  const defaultGradients = [
    'from-cobalt-blue/20 to-verdigris/20',
    'from-verdigris/20 to-cobalt-blue/20',
    'from-blue-600/10 to-indigo-600/10'
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 },
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${baseUrl}mangrove-homesection.jpg`}
            alt="Research background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal-blue/20"></div>
          <div className="absolute inset-0 bg-cobalt-blue/60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-blue/50 via-transparent to-transparent"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="font-serif text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
              {t('research.title')}
            </h1>
            <div className="h-1.5 w-32 bg-white rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* Lab History */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
          >
            <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-8">
              {String(historyContent.historyTitle ?? '')}
            </h2>
            <div className="max-w-4xl space-y-4">
              {(String(historyContent.historyContent ?? '')).split(/\n\n+/).map((paragraph, i) => (
                <p key={i} className="text-lg text-charcoal-blue leading-relaxed">
                  {paragraph.trim()}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Current Projects */}
      <section id={PROJECTS_SECTION_ID} className="py-16 bg-white scroll-mt-24">
        <div className="container-custom">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-charcoal-blue mb-10">
            {t('research.projects.title')}
          </h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <div className="space-y-20">
              {projects.map((project: any, index: number) => {
                const isEven = index % 2 === 0
                const projectTitle = String(project.title ?? '')
                const projectDescription = String(project.description ?? '')
                const gradient = defaultGradients[index % defaultGradients.length]

                return (
                  <motion.div
                    key={project.id}
                    variants={itemVariants}
                    className="group py-8 px-6 lg:px-8 hover:bg-white-smoke/60 transition-colors rounded-lg -mx-4"
                  >
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${!isEven ? 'lg:grid-flow-dense' : ''}`}>
                      {/* Left Column - Text Content */}
                      <div className={`space-y-6 pr-0 lg:pr-8 ${!isEven ? 'lg:col-start-2' : ''}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-cobalt-blue/10 text-cobalt-blue rounded-full text-xs font-medium">
                            {t(`research.projects.organisms.${project.id}`)}
                          </span>
                          {project.status && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                project.status === 'new'
                                  ? 'bg-verdigris/15 text-verdigris'
                                  : project.status === 'closed'
                                    ? 'bg-charcoal-blue/10 text-charcoal-blue/70'
                                    : 'bg-cobalt-blue/10 text-cobalt-blue'
                              }`}
                            >
                              {t(`research.projects.status.${project.status}`)}
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-lg md:text-xl lg:text-2xl font-semibold text-charcoal-blue leading-[1.2] group-hover:text-cobalt-blue transition-colors">
                          {projectTitle}
                        </h3>

                        <p 
                          className="text-base md:text-lg text-charcoal-blue/80 leading-relaxed font-sans [&_em]:italic [&_em]:font-serif [&_em]:text-charcoal-blue"
                          dangerouslySetInnerHTML={{ __html: projectDescription }}
                        />

                        <div className="flex flex-wrap gap-2 pt-2">
                          {(project.tags as string[]).map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="px-3 py-1.5 bg-white-smoke text-charcoal-blue rounded-full text-sm font-sans"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Column - Image/Visual */}
                      <div className={`${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                        <div className="relative w-full max-w-md mx-auto aspect-[4/3] lg:aspect-[4/4] rounded-lg overflow-hidden bg-gradient-to-br bg-white-smoke group-hover:shadow-2xl transition-all duration-300">
                          {project.image ? (
                            <img
                              src={`${baseUrl}${project.image}`}
                              alt={projectTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
                              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cobalt-blue/5 to-transparent"></div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
