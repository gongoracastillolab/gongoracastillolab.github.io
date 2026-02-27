import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ExternalLink, Search, ArrowUp, ArrowDown } from 'lucide-react'
import { usePublications } from '../hooks/usePublications'
import type { Publication, SortOption, SortOrder } from '../types/publications'
import PublicationDetail from '../components/PublicationDetail'

/** Normaliza texto para comparar nombres (minúsculas, sin acentos). */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s.-]+/g, ' ')
    .trim()
}

/** Indica si la cadena de autor corresponde a la PI (Elsa Beatriz Góngora Castillo). */
function isPiAuthor(author: string): boolean {
  const n = normalizeForMatch(author)
  return (n.includes('gongora') && n.includes('castillo')) || n.includes('gongora castillo')
}

/** True si la PI es primera autora o última autora (correspondencia) en la publicación. */
function isFirstOrLastAuthor(authors: string[]): boolean {
  if (!authors?.length) return false
  const first = authors[0]
  const last = authors[authors.length - 1]
  return isPiAuthor(first) || isPiAuthor(last)
}

export default function Publications() {
  const { t } = useTranslation()
  const { publications, loading, error } = usePublications()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('year')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null)

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  }

  // Publicaciones donde la PI es primera o última autora, últimos 5 años (para las 20 keywords más frecuentes)
  const publicationsFirstOrLastAuthor = useMemo(() => {
    const cutoffYear = new Date().getFullYear() - 5
    return publications.filter(
      pub => isFirstOrLastAuthor(pub.authors) && pub.year >= cutoffYear
    )
  }, [publications])

  // Top 20 keywords más frecuentes solo en publicaciones donde la PI es primera o última autora
  const allTags = useMemo(() => {
    const tagsMap = new Map<string, number>()
    publicationsFirstOrLastAuthor.forEach(pub => {
      pub.tags?.forEach(tag => {
        const normalizedTag = tag.toLowerCase()
        tagsMap.set(normalizedTag, (tagsMap.get(normalizedTag) || 0) + 1)
      })
      pub.keywords?.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase()
        tagsMap.set(normalizedKeyword, (tagsMap.get(normalizedKeyword) || 0) + 1)
      })
    })
    return Array.from(tagsMap.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        return a[0].localeCompare(b[0])
      })
      .slice(0, 20)
      .map(entry => entry[0])
  }, [publicationsFirstOrLastAuthor])

  // Filtrar y ordenar publicaciones
  const filteredPublications = useMemo(() => {
    let filtered = [...publications]

    // Búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(pub =>
        pub.title.toLowerCase().includes(query) ||
        pub.authors.some(author => author.toLowerCase().includes(query)) ||
        pub.journal?.toLowerCase().includes(query) ||
        pub.abstract?.toLowerCase().includes(query) ||
        pub.keywords?.some(kw => kw.toLowerCase().includes(query))
      )
    }

    // Filtro por tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(pub =>
        selectedTags.some(tag =>
          pub.tags?.includes(tag) ||
          pub.keywords?.some(kw => kw.toLowerCase() === tag.toLowerCase())
        )
      )
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'year':
          comparison = a.year - b.year
          break
        case 'citations':
          comparison = (a.citations || 0) - (b.citations || 0)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        default:
          return 0
      }
      // Aplicar orden (asc/desc)
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [publications, searchQuery, selectedTags, sortBy, sortOrder])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const renderMarkdown = (text: string) => {
    // Basic Markdown support for bold (**) and italic (*)
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
    return { __html: formatted }
  }

  if (loading) {
    return (
      <div className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-charcoal-blue/60">{t('publications.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-charcoal-blue/60">{t('publications.error')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Page Title */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-light text-charcoal-blue mb-4">
                  {t('publications.title')}
                </h1>
                <div className="h-1 w-24 bg-cobalt-blue"></div>
              </div>
              <a
                href="https://scholar.google.com/citations?view_op=list_works&hl=en&user=Rv6zyJ8AAAAJ&sortby=pubdate"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors font-medium mt-4 md:mt-0"
              >
                <span>{t('publications.viewScholar')}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-blue/40" />
              <input
                type="text"
                placeholder={t('publications.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-pale-slate rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-blue focus:border-transparent text-charcoal-blue"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-cobalt-blue text-white'
                          : 'bg-white-smoke text-charcoal-blue hover:bg-cobalt-blue/10'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1 border border-pale-slate rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-blue text-charcoal-blue bg-white"
                >
                  <option value="year">{t('publications.sort.year')}</option>
                  <option value="citations">{t('publications.sort.citations')}</option>
                  <option value="title">{t('publications.sort.title')}</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-pale-slate rounded-lg hover:bg-white-smoke transition-colors"
                  aria-label={sortOrder === 'asc' ? t('publications.sort.desc') : t('publications.sort.asc')}
                  title={sortOrder === 'asc' ? t('publications.sort.desc') : t('publications.sort.asc')}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="w-4 h-4 text-charcoal-blue" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-charcoal-blue" />
                  )}
                </button>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-charcoal-blue/60 mb-6">
              {filteredPublications.length === publications.length
                ? t('publications.count', { count: publications.length })
                : t('publications.filteredCount', { filtered: filteredPublications.length, total: publications.length })}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Publications List */}
      <section className="py-8 bg-white">
        <div className="container-custom">
          {filteredPublications.length === 0 ? (
            <motion.div
              {...fadeInUp}
              className="text-center py-12"
            >
              <p className="text-charcoal-blue/60">{t('publications.noResults')}</p>
            </motion.div>
          ) : (
            <div className="space-y-10">
              {filteredPublications.map((pub) => {
                // Obtener snippet del abstract (primeros 250 caracteres)
                const abstractSnippet = pub.abstract 
                  ? pub.abstract.length > 250 
                    ? pub.abstract.substring(0, 250) + '...' 
                    : pub.abstract
                  : null

                return (
                  <div
                    key={pub.id}
                    className="cursor-pointer py-5 px-4 hover:bg-white-smoke/60 transition-colors rounded-lg"
                    onClick={() => setSelectedPublication(pub)}
                  >
                    {/* Fecha */}
                    <p className="text-xs text-charcoal-blue/50 mb-3">
                      {pub.year}
                    </p>

                    {/* Título */}
                    <h3 className="font-serif text-xl md:text-2xl font-semibold text-cobalt-blue mb-4 hover:text-hover-blue transition-colors leading-tight">
                      {pub.title}
                    </h3>

                    {/* Métricas en badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {pub.citations !== undefined && pub.citations > 0 && (
                        <span className="px-3 py-1 bg-white-smoke text-charcoal-blue rounded-full text-xs font-medium">
                          {pub.citations} {pub.citations === 1 ? 'citation' : 'citations'}
                        </span>
                      )}
                      {pub.journal && (
                        <span className="px-3 py-1 bg-white-smoke text-charcoal-blue rounded-full text-xs font-medium">
                          {pub.journal}
                        </span>
                      )}
                    </div>

                    {/* Abstract snippet */}
                    {abstractSnippet && (
                      <p 
                        className="text-sm text-charcoal-blue/80 mb-4 leading-relaxed"
                        dangerouslySetInnerHTML={renderMarkdown(abstractSnippet)}
                      />
                    )}

                    {/* Autores */}
                    <p className="text-sm text-charcoal-blue/70 mb-4">
                      {pub.authors.join(', ')}
                    </p>

                    {/* Keywords en badges */}
                    {pub.keywords && pub.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pub.keywords.slice(0, 10).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white-smoke text-charcoal-blue rounded-full text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Publication Detail Modal */}
      <PublicationDetail
        publication={selectedPublication}
        isOpen={!!selectedPublication}
        onClose={() => setSelectedPublication(null)}
      />
    </div>
  )
}
