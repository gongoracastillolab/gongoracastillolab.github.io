import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ExternalLink, Mic, Video, Calendar, FileText, ArrowDown, ArrowUp } from 'lucide-react'
import DetailSidebar from '../components/DetailSidebar'
import { useLocalizedData } from '../hooks/useLocalizedData'

const baseUrl = (import.meta as any).env.BASE_URL

interface OutreachItem {
  id: string
  type: 'podcast' | 'video' | 'event' | 'article'
  title: string
  description: string
  date: string
  url?: string
  urls?: string[] | null
  image?: string
  /** Galería de fotos (varias imágenes); en el CMS: images: [{ src, caption? }, ...] */
  images?: { src: string; caption?: string }[] | null
  embed?: string
}

export default function Outreach() {
  const { t } = useTranslation()
  const { outreach: outreachItemsRaw, lang } = useLocalizedData()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<OutreachItem | null>(null)
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc')

  const tabs = [
    { id: 'all', label: t('outreach.all', 'All'), icon: null },
    { id: 'events', label: t('outreach.events'), icon: Calendar },
    { id: 'articles', label: t('outreach.articles'), icon: FileText },
    { id: 'podcasts', label: t('outreach.podcasts'), icon: Mic },
    { id: 'videos', label: t('outreach.videos'), icon: Video },
  ]

  const outreachItems: OutreachItem[] = (outreachItemsRaw as any[]).map((item: any) => {
    const imagesRaw = item.images as { src?: string; caption?: string }[] | undefined
    const imagesResolved: { src: string; caption?: string }[] | undefined = imagesRaw?.length
      ? imagesRaw
          .filter((im: { src?: string }) => im?.src)
          .map((im: { src?: string; caption?: string }) => ({
            src: `${baseUrl}${String(im.src).replace(/^\//, '')}`,
            caption: im.caption ? String(im.caption).trim() : undefined
          }))
      : undefined
    const imageResolved = item.image
      ? `${baseUrl}${item.image.replace(/^\//, '')}`
      : imagesResolved?.[0]?.src
    return {
      ...item,
      image: imageResolved,
      images: imagesResolved ?? null
    }
  })

  const tabToTypeMap: Record<string, string> = {
    'podcasts': 'podcast',
    'videos': 'video',
    'events': 'event',
    'articles': 'article',
  }

  const filteredItems = activeTab === 'all' 
    ? outreachItems 
    : outreachItems.filter(item => item.type === tabToTypeMap[activeTab])

  const sortedItems = [...filteredItems].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateSortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const locale = lang === 'es' ? 'es-ES' : 'en-US'
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'podcast': return Mic
      case 'video': return Video
      case 'event': return Calendar
      case 'article': return FileText
      default: return FileText
    }
  }

  const getTypeStyle = (type: string): { chipBgClass: string; labelKey: string } => {
    switch (type) {
      case 'article': return { chipBgClass: 'bg-cobalt-blue', labelKey: 'outreach.typeArticle' }
      case 'event': return { chipBgClass: 'bg-verdigris', labelKey: 'outreach.typeEvent' }
      case 'podcast': return { chipBgClass: 'bg-verde-piaget', labelKey: 'outreach.typePodcast' }
      case 'video': return { chipBgClass: 'bg-charcoal-blue', labelKey: 'outreach.typeVideo' }
      default: return { chipBgClass: 'bg-cobalt-blue', labelKey: 'outreach.typeArticle' }
    }
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
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  return (
    <div className="py-16 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-light text-charcoal-blue mb-4">
            {t('outreach.title')}
          </h1>
          <div className="h-1 w-24 bg-cobalt-blue"></div>
        </motion.div>

        <div className="border-b border-pale-slate mb-8">
          <nav className="flex flex-wrap gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 font-sans text-base font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-cobalt-blue border-cobalt-blue'
                      : 'text-charcoal-blue/70 border-transparent hover:text-cobalt-blue hover:border-cobalt-blue/50'
                  }`}
                >
                  {Icon && <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-cobalt-blue' : 'text-charcoal-blue/70'}`} strokeWidth={2} />}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
          <button
            type="button"
            onClick={() => setDateSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal-blue bg-white border border-pale-slate rounded-lg hover:border-cobalt-blue hover:text-cobalt-blue transition-colors"
            aria-label={dateSortOrder === 'desc' ? t('outreach.sortToggleToOldest') : t('outreach.sortToggleToNewest')}
          >
            {dateSortOrder === 'desc' ? (
              <>
                <ArrowDown className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                <span>{t('outreach.newestFirst')}</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                <span>{t('outreach.oldestFirst')}</span>
              </>
            )}
          </button>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`${activeTab}-${dateSortOrder}`}
        >
          {sortedItems.map((item) => {
            const Icon = getIcon(item.type)
            const { chipBgClass } = getTypeStyle(item.type)
            const title = String(item.title ?? '')
            const description = String(item.description ?? '')
            
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="group/card card cursor-pointer hover:shadow-xl transition-all duration-300"
                onClick={() => setSelectedItem(item)}
              >
                {(item.image || (item.images?.length ? item.images[0].src : null)) ? (
                  <div className="card-image-top w-full aspect-video overflow-hidden relative">
                    <img
                      src={item.image || item.images![0].src}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    />
                    <div className="absolute inset-0 bg-charcoal-blue/0 group-hover/card:bg-charcoal-blue/10 transition-colors duration-300 pointer-events-none" aria-hidden />
                  </div>
                ) : (
                  <div className="card-image-top w-full aspect-video bg-gradient-to-br from-cobalt-blue/10 to-verdigris/10 group-hover/card:from-cobalt-blue/15 group-hover/card:to-verdigris/15 transition-colors duration-300" />
                )}
                <div className="card-body">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white flex-shrink-0 ${chipBgClass}`} aria-hidden>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <span className="text-xs text-charcoal-blue/60">{formatDate(item.date)}</span>
                  </div>
                  <h3 className="font-serif text-lg font-medium text-charcoal-blue mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-charcoal-blue/70 line-clamp-2 mb-3">
                    {description}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-cobalt-blue">
                    <span>{t('outreach.viewDetails')}</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {sortedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-charcoal-blue/70">{t('outreach.noResults')}</p>
          </div>
        )}
      </div>

      <DetailSidebar
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? String(selectedItem.title ?? '') : ''}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-4">
                {(() => {
                  const Icon = getIcon(selectedItem.type)
                  const { chipBgClass, labelKey } = getTypeStyle(selectedItem.type)
                  return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white ${chipBgClass}`}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                      <span className="font-sans font-light text-sm uppercase tracking-wider">{t(labelKey)}</span>
                    </span>
                  )
                })()}
                <span className="text-sm text-charcoal-blue/60">•</span>
                <span className="text-sm text-charcoal-blue/60">{formatDate(selectedItem.date)}</span>
              </div>
              
              {(selectedItem.images?.length || selectedItem.image) && (
                <div className="mb-6 group/caption relative">
                  <img
                    src={selectedItem.image!}
                    alt={String(selectedItem.title ?? '')}
                    title={selectedItem.images?.[0]?.caption ?? undefined}
                    className="w-full max-w-lg mx-auto rounded-lg"
                  />
                  {selectedItem.images?.[0]?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 max-w-lg mx-auto rounded-b-lg bg-charcoal-blue/80 text-white text-sm py-2 px-3 opacity-0 group-hover/caption:opacity-100 transition-opacity duration-200">
                      {selectedItem.images[0].caption}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-serif text-xl font-medium text-charcoal-blue mb-3">
                {t('outreach.description')}
              </h3>
              <p className="text-charcoal-blue/70 leading-relaxed">
                {String(selectedItem.description ?? '')}
              </p>
            </div>

            {selectedItem.images && selectedItem.images.length > 1 && (
              <div>
                <h3 className="font-serif text-lg font-medium text-charcoal-blue mb-3">
                  {t('outreach.gallery')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedItem.images.slice(1).map((img, idx) => (
                    <div key={idx} className="group/cap relative">
                      <img
                        src={img.src}
                        alt={img.caption || `${String(selectedItem.title ?? '')} - ${idx + 2}`}
                        title={img.caption ?? undefined}
                        className="w-full rounded-lg object-cover aspect-video"
                      />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-charcoal-blue/80 text-white text-sm py-2 px-3 opacity-0 group-hover/cap:opacity-100 transition-opacity duration-200">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.urls && selectedItem.urls.length > 0 && (
              <div>
                <h3 className="font-serif text-lg font-medium text-charcoal-blue mb-3">
                  {selectedItem.type === 'podcast'
                    ? t('outreach.podcasts')
                    : selectedItem.type === 'video'
                      ? t('outreach.videos')
                      : t('outreach.links')}
                </h3>
                <div className="space-y-2">
                  {selectedItem.urls.map((itemUrl, index) => {
                    const videoId =
                      selectedItem.type === 'video'
                        ? itemUrl.includes('youtu.be/')
                          ? itemUrl.split('youtu.be/')[1]?.split('?')[0]
                          : itemUrl.includes('youtube.com/watch?v=')
                            ? itemUrl.split('v=')[1]?.split('&')[0]
                            : null
                        : null
                    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
                    const linkLabel =
                      selectedItem.type === 'podcast'
                        ? `${t('outreach.episode')} ${index + 1}`
                        : selectedItem.type === 'video'
                          ? `${t('outreach.videoLabel')} ${index + 1}`
                          : `${t('outreach.link')} ${index + 1}`
                    const LinkIcon =
                      selectedItem.type === 'podcast'
                        ? Mic
                        : selectedItem.type === 'video'
                          ? Video
                          : ExternalLink
                    return (
                      <a
                        key={index}
                        href={itemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 rounded-lg border border-pale-slate hover:border-cobalt-blue hover:bg-cobalt-blue/5 transition-colors group"
                      >
                        {thumbnailUrl && (
                          <img
                            src={thumbnailUrl}
                            alt={linkLabel}
                            className="w-24 h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <LinkIcon className="w-4 h-4 text-cobalt-blue flex-shrink-0" strokeWidth={2} />
                            <span className="text-sm font-medium text-charcoal-blue group-hover:text-cobalt-blue">
                              {linkLabel}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-blue/60 truncate mt-1">{itemUrl}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-charcoal-blue/60 group-hover:text-cobalt-blue flex-shrink-0" />
                      </a>
                    )
                  })}
                </div>
                {selectedItem.url && (
                  <div className="mt-4">
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cobalt-blue hover:text-hover-blue transition-colors flex items-center space-x-1"
                    >
                      <span>{t('outreach.viewAll', 'View all')}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {selectedItem.url && !selectedItem.urls && (
              <div>
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 btn-primary"
                >
                  <span>
                    {selectedItem.type === 'podcast' 
                      ? t('outreach.onSpotify') 
                      : selectedItem.type === 'video' 
                        ? t('outreach.onYouTube') 
                        : t('outreach.article')}
                  </span>
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}

            {selectedItem.embed && (
              <div className="mt-6">
                <div dangerouslySetInnerHTML={{ __html: selectedItem.embed }} />
              </div>
            )}
          </div>
        )}
      </DetailSidebar>
    </div>
  )
}
