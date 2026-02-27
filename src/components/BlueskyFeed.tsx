import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ExternalLink, Calendar } from 'lucide-react'
import { useBlueskyFeed, BlueskyPost } from '../hooks/useBlueskyFeed'

function formatDate(dateString: string, t: ReturnType<typeof useTranslation>['t']): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return t('home.bluesky.justNow')
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return t('home.bluesky.minutesAgo', { count: diffInMinutes })
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return t('home.bluesky.hoursAgo', { count: diffInHours })
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return t('home.bluesky.daysAgo', { count: diffInDays })
  }
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPostText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength).trim() + '...'
}

function getPostUrl(post: BlueskyPost): string {
  const handle = post.author.handle
  const rkey = post.uri.split('/').pop()
  return `https://bsky.app/profile/${handle}/post/${rkey}`
}

export default function BlueskyFeed() {
  const { t } = useTranslation()
  const { posts, loading, error } = useBlueskyFeed(3)

  if (loading) {
    return (
      <section className="py-16 bg-white-smoke">
        <div className="container-custom">
          <div className="text-center">
            <p className="text-charcoal-blue/60">{t('home.bluesky.loading')}</p>
          </div>
        </div>
      </section>
    )
  }

  if (error || posts.length === 0) {
    return null // No mostrar nada si hay error o no hay posts
  }

  return (
    <section className="py-16 bg-white-smoke">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl font-light text-charcoal-blue mb-2">
                {t('home.bluesky.title')}
              </h2>
              <p className="text-charcoal-blue/70">
                {t('home.bluesky.subtitle')}
              </p>
            </div>
            <a
              href={`https://bsky.app/profile/${posts[0]?.author.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-cobalt-blue hover:text-hover-blue transition-colors font-medium"
            >
              <span>{t('home.bluesky.viewAll')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.uri}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-all duration-300 group cursor-pointer"
                onClick={() => window.open(getPostUrl(post), '_blank', 'noopener,noreferrer')}
              >
                <div className="card-body">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {post.author.avatar && (
                        <img
                          src={post.author.avatar}
                          alt={post.author.displayName || post.author.handle}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-charcoal-blue text-sm">
                          {post.author.displayName || post.author.handle}
                        </p>
                        <p className="text-xs text-charcoal-blue/60">
                          @{post.author.handle}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-charcoal-blue/40 group-hover:text-cobalt-blue transition-colors" />
                  </div>

                  {/* Post Text */}
                  <p className="text-charcoal-blue leading-relaxed mb-4 line-clamp-4">
                    {formatPostText(post.record.text, 150)}
                  </p>

                  {/* Post Media - Puede ser imágenes o enlace externo */}
                  {/* Primero verificar si hay embed en el nivel superior del post */}
                  {(() => {
                    // El embed puede estar en post.embed o en post.record.embed
                    const embed = post.embed || post.record.embed
                    
                    if (!embed) {
                      return null
                    }
                    
                    // Si es un embed de imágenes
                    if (embed.images && embed.images.length > 0) {
                      const firstImage = embed.images[0]
                      
                      // La API puede devolver las imágenes con URLs directas (thumb/fullsize) 
                      // o con estructura image.ref.$link
                      let imageUrl: string | null = null
                      let thumbnailUrl: string | null = null
                      
                      // Verificar si tiene la estructura nueva con thumb/fullsize
                      if ('fullsize' in firstImage && firstImage.fullsize) {
                        imageUrl = firstImage.fullsize
                        thumbnailUrl = firstImage.thumb || null
                      } else if ('thumb' in firstImage && firstImage.thumb) {
                        imageUrl = firstImage.thumb
                      } else if ('image' in firstImage && firstImage.image?.ref?.$link) {
                        // Estructura antigua con ref.$link
                        imageUrl = `https://cdn.bsky.app/img/feed_fullsize/plain/${firstImage.image.ref.$link}`
                        thumbnailUrl = `https://cdn.bsky.app/img/feed_thumbnail/plain/${firstImage.image.ref.$link}`
                      }
                      
                      if (imageUrl) {
                        return (
                          <div className="mb-4 rounded-lg overflow-hidden relative">
                            <img
                              src={imageUrl}
                              alt={firstImage.alt || 'Post image'}
                              className="w-full h-48 object-cover bg-white-smoke"
                              loading="lazy"
                              onError={(e) => {
                                // Si falla fullsize, intentar con thumb
                                const target = e.target as HTMLImageElement
                                if (thumbnailUrl && target.src === imageUrl) {
                                  target.src = thumbnailUrl
                                } else {
                                  target.style.display = 'none'
                                }
                              }}
                            />
                            {/* Indicador si hay múltiples imágenes */}
                            {embed.images.length > 1 && (
                              <div className="absolute top-2 right-2 bg-charcoal-blue/80 text-white text-xs px-2 py-1 rounded">
                                +{embed.images.length - 1}
                              </div>
                            )}
                          </div>
                        )
                      }
                    }
                    
                    // Si es un embed externo (enlace compartido)
                    if (embed.external) {
                      const external = embed.external
                      // El thumb puede ser una URL directa o un objeto con ref.$link
                      let thumbUrl: string | null = null
                      
                      if (external.thumb) {
                        if (typeof external.thumb === 'string') {
                          // Caso 1: URL directa
                          thumbUrl = external.thumb
                        } else if (external.thumb.ref?.$link) {
                          // Caso 2: Estructura con ref.$link
                          thumbUrl = `https://cdn.bsky.app/img/feed_thumbnail/plain/${external.thumb.ref.$link}`
                        }
                      }
                      
                      return (
                        <a
                          href={external.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mb-4 rounded-lg overflow-hidden border border-pale-slate block hover:border-cobalt-blue transition-colors"
                        >
                          {thumbUrl && (
                            <img
                              src={thumbUrl}
                              alt={external.title || 'Link preview'}
                              className="w-full h-32 object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="p-3 bg-white-smoke">
                            <p className="text-sm font-medium text-charcoal-blue line-clamp-1 flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                              {external.title || external.uri}
                            </p>
                            {external.description && (
                              <p className="text-xs text-charcoal-blue/60 line-clamp-2 mt-1">
                                {external.description}
                              </p>
                            )}
                          </div>
                        </a>
                      )
                    }
                    
                    return null
                  })()}

                  {/* Post Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-pale-slate">
                    <div className="flex items-center space-x-2 text-sm text-charcoal-blue/60">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.record.createdAt, t)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-charcoal-blue/60">
                      {post.replyCount !== undefined && (
                        <span>{post.replyCount}</span>
                      )}
                      {post.repostCount !== undefined && (
                        <span>{post.repostCount}</span>
                      )}
                      {post.likeCount !== undefined && (
                        <span className="text-cobalt-blue">{post.likeCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
