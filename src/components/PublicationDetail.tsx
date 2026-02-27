import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, FileText, Calendar, Users, BookOpen, Quote } from 'lucide-react'
import type { Publication } from '../types/publications'

interface PublicationDetailProps {
  publication: Publication | null
  isOpen: boolean
  onClose: () => void
}

export default function PublicationDetail({ publication, isOpen, onClose }: PublicationDetailProps) {
  const { t } = useTranslation()
  if (!publication) return null

  const formatAuthors = (authors: string[]): string => {
    if (authors.length === 0) return ''
    // Filtrar cualquier "..." que pueda haber quedado
    const cleanAuthors = authors.filter(a => {
      const trimmed = a.trim().toLowerCase()
      return trimmed !== '...' && trimmed !== 'et al' && trimmed !== 'et al.' && !trimmed.startsWith('...')
    })
    if (cleanAuthors.length === 0) return ''
    // En el sidebar mostrar TODOS los autores
    return cleanAuthors.join(', ')
  }

  const renderMarkdown = (text: string) => {
    // Basic Markdown support for bold (**) and italic (*)
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    return { __html: formatted }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-pale-slate px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium text-charcoal-blue">{t('publicationDetail.title')}</h2>
              <button
                onClick={onClose}
                className="text-charcoal-blue hover:text-cobalt-blue transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <h3 className="font-serif text-2xl font-medium text-charcoal-blue mb-4">
                  {publication.title}
                </h3>
              </div>

              {/* Authors */}
              {publication.authors.length > 0 && (
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-cobalt-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-charcoal-blue/60 mb-1">{t('publicationDetail.authors')}</p>
                    <p className="text-charcoal-blue">{formatAuthors(publication.authors)}</p>
                  </div>
                </div>
              )}

              {/* Journal Info */}
              {(publication.journal || publication.year) && (
                <div className="flex items-start space-x-3">
                  <BookOpen className="w-5 h-5 text-cobalt-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-charcoal-blue/60 mb-1">{t('publicationDetail.publication')}</p>
                    <p className="text-charcoal-blue">
                      {publication.journal && <span className="font-medium">{publication.journal}</span>}
                      {publication.year && (
                        <span className={publication.journal ? ' ml-2' : ''}>{publication.year}</span>
                      )}
                      {publication.volume && <span>, Vol. {publication.volume}</span>}
                      {publication.pages && <span>, pp. {publication.pages}</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Abstract */}
              {publication.abstract && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Quote className="w-5 h-5 text-cobalt-blue" />
                    <h4 className="font-serif text-lg font-medium text-charcoal-blue">{t('publicationDetail.abstract')}</h4>
                  </div>
                  <p 
                    className="text-charcoal-blue leading-relaxed"
                    dangerouslySetInnerHTML={renderMarkdown(publication.abstract)}
                  />
                </div>
              )}

              {/* Keywords */}
              {publication.keywords && publication.keywords.length > 0 && (
                <div>
                  <h4 className="font-serif text-lg font-medium text-charcoal-blue mb-3">{t('publicationDetail.keywords')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {publication.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white-smoke text-charcoal-blue rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {publication.tags && publication.tags.length > 0 && (
                <div>
                  <h4 className="font-serif text-lg font-medium text-charcoal-blue mb-3">{t('publicationDetail.tags')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {publication.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-cobalt-blue/10 text-cobalt-blue rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {(publication.citations !== undefined || publication.year) && (
                <div className="border-t border-pale-slate pt-4">
                  <h4 className="font-serif text-lg font-medium text-charcoal-blue mb-3">{t('publicationDetail.metrics')}</h4>
                  <div className="flex flex-wrap gap-4">
                    {publication.year && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-charcoal-blue/60" />
                        <span className="text-charcoal-blue">{publication.year}</span>
                      </div>
                    )}
                    {publication.citations !== undefined && (
                      <div className="flex items-center space-x-2">
                        <Quote className="w-4 h-4 text-charcoal-blue/60" />
                        <span className="text-charcoal-blue">{publication.citations} {t('publications.citations')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Links */}
              {(publication.doi || publication.pdfUrl || publication.pubmedUrl || publication.scholarUrl) && (
                <div className="border-t border-pale-slate pt-4">
                  <h4 className="font-serif text-lg font-medium text-charcoal-blue mb-3">{t('publicationDetail.links')}</h4>
                  <div className="flex flex-wrap gap-3">
                    {publication.doi && (
                      <a
                        href={`https://doi.org/${publication.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>DOI</span>
                      </a>
                    )}
                    {publication.pdfUrl && (
                      <a
                        href={publication.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>PDF</span>
                      </a>
                    )}
                    {publication.pubmedUrl && (
                      <a
                        href={publication.pubmedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>PubMed</span>
                      </a>
                    )}
                    {publication.scholarUrl && (
                      <a
                        href={publication.scholarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Google Scholar</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
