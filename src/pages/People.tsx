import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import membersData from '../data/members.json'
import staffCollaboratorsData from '../data/staff_collaborators.json'
import alumniData from '../data/alumni.json'
import groupPhotosData from '../data/group_photos.json'
import { useLocalizedData } from '../hooks/useLocalizedData'
import { emailToDisplayText, emailToMailtoHref } from '../utils/emailDisplay'

const baseUrl = import.meta.env.BASE_URL
const PeopleHeroImage = `${baseUrl}people_hero_section.png`
const DraElsaGongora = `${baseUrl}DraElsaGongora.jpg`

export default function People() {
  const { t } = useTranslation()
  const { pi: piContent } = useLocalizedData()
  const piOrcidUrl = piContent?.orcidUrl != null ? String(piContent.orcidUrl) : ''
  const piResearchGateUrl = piContent?.researchGateUrl != null ? String(piContent.researchGateUrl) : ''
  const [selectedImage, setSelectedImage] = useState<{ year: string; image: string } | null>(null)
  
  const groupPhotos = (groupPhotosData as any).groupPhotos.map((photo: any) => ({
    ...photo,
    image: `${baseUrl}${photo.image}`
  }))
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  
  const nextPhoto = () => {
    const maxIndex = Math.max(0, groupPhotos.length - 3)
    setCurrentPhotoIndex((prev) => Math.min(prev + 1, maxIndex))
  }
  
  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => Math.max(prev - 1, 0))
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 },
  }

  const labMembers = (membersData as any).members.map((member: any) => ({
    ...member,
    role: t(member.roleKey),
    image: member.image ? `${baseUrl}${member.image}` : null
  }))

  const technicalStaff = staffCollaboratorsData.technicalStaff.map(staff => ({
    ...staff,
    role: t(staff.roleKey),
    image: staff.image ? `${baseUrl}${staff.image}` : null
  }))

  const collaborators = staffCollaboratorsData.collaborators.map(collab => ({
    ...collab,
    country: t(collab.countryKey)
  }))

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={PeopleHeroImage}
            alt="Lab Group"
            className="w-full h-full object-cover object-top"
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
              {t('people.title')}
            </h1>
            <div className="h-1.5 w-32 bg-white rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* Principal Investigator Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            {...fadeInUp}
          >
            <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-8">
              {t('people.pi.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 flex justify-center md:justify-start">
                <div className="max-w-[360px] w-full">
                  <img
                    src={DraElsaGongora}
                    alt={t('people.pi.name')}
                    className="lab-image w-full rounded-xl shadow-lg border border-border-gray"
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="font-serif text-2xl font-medium text-charcoal-blue mb-2">
                  {String(piContent.name ?? '')}
                </h3>
                <p className="text-charcoal-blue/70 mb-1">{String(piContent.position ?? '')}</p>
                <p className="text-charcoal-blue/70">{String(piContent.institution ?? '')}</p>
                <a
                  href={`mailto:${emailToMailtoHref(String(piContent.email ?? ''))}`}
                  className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors mt-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>{emailToDisplayText(String(piContent.email ?? ''))}</span>
                </a>
                {(piOrcidUrl || piResearchGateUrl) ? (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {piOrcidUrl ? (
                      <a
                        href={piOrcidUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-cobalt-blue hover:text-hover-blue transition-colors"
                        aria-label="ORCID"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span>ORCID</span>
                      </a>
                    ) : null}
                    {piResearchGateUrl ? (
                      <a
                        href={piResearchGateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-cobalt-blue hover:text-hover-blue transition-colors"
                        aria-label="ResearchGate"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        <span>ResearchGate</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div>
                <div className="space-y-3 mb-4">
                  {(String(piContent.bio ?? '')).split(/\n\n+/).filter(Boolean).map((paragraph, i) => (
                    <p key={i} className="text-charcoal-blue leading-relaxed">
                      {String(paragraph)}
                    </p>
                  ))}
                </div>
                  <div>
                    <h4 className="font-serif text-xl font-medium text-charcoal-blue mb-6 px-4 -mx-4">
                      {t('people.pi.education.title')}
                    </h4>
                    <div className="space-y-2">
                      {(piContent.education as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="py-2 px-4 hover:bg-white-smoke/40 transition-colors rounded-lg -mx-4 flex items-start gap-4">
                          <span className="text-xs text-charcoal-blue/50 font-medium min-w-[60px]">
                            {item.year === 'Current' ? t('people.pi.education.current_date', 'Actual') : String(item.year ?? '')}
                          </span>
                          <p className="text-base text-charcoal-blue/80 leading-relaxed font-sans flex-1">
                            {String(item.text ?? '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lab Members */}
      <section className="py-16 bg-white-smoke">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-8">
              {t('people.members.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {labMembers.map((member: any) => (
              <motion.div
                key={member.name}
                variants={itemVariants}
                className="card text-center"
              >
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="card-image-top w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="card-image-top w-full aspect-square bg-white-smoke flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                <div className="card-body">
                  <h3 className="font-serif text-lg font-medium text-charcoal-blue mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-charcoal-blue/70 mb-1">{member.role}</p>
                  {(member.department || member.institution) && (
                    <div className="mb-2 space-y-0.5">
                      {member.department && (
                        <p className="text-xs text-charcoal-blue/60">{member.department}</p>
                      )}
                      {member.institution && (
                        <p className="text-xs text-charcoal-blue/60">{member.institution}</p>
                      )}
                    </div>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${emailToMailtoHref(member.email)}`}
                      className="text-sm text-cobalt-blue hover:text-hover-blue transition-colors"
                    >
                      {emailToDisplayText(member.email)}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technical Staff */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-8">
              {t('people.alumni.technicalStaff')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicalStaff.map((staff) => (
              <motion.div
                key={staff.name}
                variants={itemVariants}
                className="card text-center"
              >
                {staff.image ? (
                  <img
                    src={staff.image}
                    alt={staff.name}
                    className="card-image-top w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="card-image-top w-full aspect-square bg-white-smoke flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                <div className="card-body">
                  <h3 className="font-serif text-lg font-medium text-charcoal-blue mb-1">
                    {staff.name}
                  </h3>
                  <p className="text-sm text-charcoal-blue/70">{staff.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
          </motion.div>
        </div>
      </section>

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container-custom">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-8">
                {t('people.collaborators.title')}
              </h2>
              <div className="max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collaborators.map((collab) => (
                    <motion.div
                      key={collab.name}
                      variants={itemVariants}
                      className="py-4 px-4 bg-white-smoke/40 hover:bg-white-smoke/60 transition-colors rounded-lg group"
                    >
                      <h3 className="font-serif text-lg font-medium text-charcoal-blue mb-1 group-hover:text-cobalt-blue transition-colors">
                        {collab.name}
                      </h3>
                      <p className="text-sm text-charcoal-blue/70 mb-2">{collab.affiliation}</p>
                      <span className="inline-block px-3 py-1 bg-white-smoke text-charcoal-blue rounded-full text-xs font-medium">
                        {collab.country}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Alumni Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            id="alumni"
          >
            <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-12">
              {t('people.alumni.title')}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="space-y-6">
                  {/* Postdocs */}
                  {(alumniData as any).graduated.postdoc && (alumniData as any).graduated.postdoc.length > 0 && (
                    <div>
                      <h3 className="font-serif text-xl font-medium text-charcoal-blue mb-4">
                        {t('people.alumni.postdoc')}
                      </h3>
                      <div className="space-y-1">
                        {(alumniData as any).graduated.postdoc.map((alum: any) => (
                          <motion.div key={alum.name} variants={itemVariants} className="py-2 px-4 hover:bg-white-smoke/60 transition-colors rounded-lg -mx-4 flex items-center gap-4 group">
                            <span className="text-xs text-charcoal-blue/50 font-medium min-w-[50px]">{alum.year}</span>
                            <p className="text-base text-charcoal-blue font-sans flex-1 group-hover:text-cobalt-blue transition-colors">{alum.name}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PhD */}
                  <div>
                    <h3 className="font-serif text-xl font-medium text-charcoal-blue mb-4">
                      {t('people.alumni.phd')}
                    </h3>
                    <div className="space-y-1">
                      {(alumniData as any).graduated.phd.map((alum: any) => (
                        <motion.div key={alum.name} variants={itemVariants} className="py-2 px-4 hover:bg-white-smoke/60 transition-colors rounded-lg -mx-4 flex items-center gap-4 group">
                          <span className="text-xs text-charcoal-blue/50 font-medium min-w-[50px]">{alum.year}</span>
                          <p className="text-base text-charcoal-blue font-sans flex-1 group-hover:text-cobalt-blue transition-colors">{alum.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Master's */}
                  <div>
                    <h3 className="font-serif text-xl font-medium text-charcoal-blue mb-4">
                      {t('people.alumni.ms')}
                    </h3>
                    <div className="space-y-1">
                      {(alumniData as any).graduated.ms.map((alum: any) => (
                        <motion.div key={alum.name} variants={itemVariants} className="py-2 px-4 hover:bg-white-smoke/60 transition-colors rounded-lg -mx-4 flex items-center gap-4 group">
                          <span className="text-xs text-charcoal-blue/50 font-medium min-w-[50px]">{alum.year}</span>
                          <p className="text-base text-charcoal-blue font-sans flex-1 group-hover:text-cobalt-blue transition-colors">{alum.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Undergraduate Students and Research Stays */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="font-serif text-xl font-medium text-charcoal-blue mb-4">
                  {t('people.alumni.undergraduate')}
                </h3>
                <div className="space-y-1">
                  {(alumniData as any).undergraduate.map((alum: any) => (
                    <motion.div key={alum.name} variants={itemVariants} className="py-2 px-4 hover:bg-white-smoke/60 transition-colors rounded-lg -mx-4 flex items-start gap-4 group">
                      <span className="text-xs text-charcoal-blue/50 font-medium min-w-[50px]">{alum.year}</span>
                      <div className="flex-1">
                        <p className="text-base text-charcoal-blue font-sans mb-0.5 group-hover:text-cobalt-blue transition-colors">{alum.name}</p>
                        <p className="text-sm text-charcoal-blue/70 font-sans">{alum.inst}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Group Photos */}
      <section className="py-16 bg-white">
        <div className="w-full">
          <div className="container-custom mb-8">
            <motion.div
              {...fadeInUp}
              transition={{ delay: 1.0 }}
            >
              <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-8">
                {t('outreach.groupPhotos')}
              </h2>
            </motion.div>
          </div>
          
          <div className="relative w-full">
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6 text-charcoal-blue" />
            </button>
            
            <div className="w-full overflow-hidden px-12">
              <motion.div
                className="flex gap-2"
                animate={{
                  x: `-${currentPhotoIndex * (100 / 3)}%`
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                }}
              >
                {groupPhotos.map((photo: any, index: number) => (
                  <motion.div
                    key={photo.year}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex-shrink-0 relative cursor-pointer group"
                    style={{ width: `calc(${100 / 3}% - 0.5rem)` }}
                    onClick={() => setSelectedImage(photo)}
                  >
                    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg">
                      <img
                        src={photo.image}
                        alt={`Group photo ${photo.year}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-cobalt-blue/90 via-cobalt-blue/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end rounded-lg">
                        <div className="w-full pb-6 text-center">
                          <p className="text-white font-serif text-2xl md:text-3xl font-medium">
                            {photo.year}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6 text-charcoal-blue" />
            </button>
            
            <div className="flex justify-center gap-2 mt-6">
              {groupPhotos.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentPhotoIndex
                      ? 'bg-cobalt-blue w-8'
                      : 'bg-charcoal-blue/30 w-2 hover:bg-charcoal-blue/50'
                  }`}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-7xl max-h-full"
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-12 right-0 text-white hover:text-white/80 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-8 h-8" />
                </button>
                <img
                  src={selectedImage.image}
                  alt={`Group photo ${selectedImage.year}`}
                  className="rounded-lg max-w-full max-h-[90vh] object-contain"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
