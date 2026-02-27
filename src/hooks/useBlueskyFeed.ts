import { useState, useEffect } from 'react'

const BLUESKY_API_BASE = 'https://public.api.bsky.app/xrpc'
const BLUESKY_HANDLE = 'gongoralab.bsky.social'

export interface BlueskyPost {
  uri: string
  cid: string
  author: {
    did: string
    handle: string
    displayName?: string
    avatar?: string
  }
  record: {
    text: string
    createdAt: string
      embed?: {
        $type?: string
        images?: Array<{
          alt: string
          thumb?: string
          fullsize?: string
          image?: {
            ref: {
              $link: string
            }
            mimeType: string
            size: number
          }
          aspectRatio?: {
            width: number
            height: number
          }
        }>
      external?: {
        uri: string
        title: string
        description: string
        thumb?: {
          ref?: {
            $link: string
          }
          mimeType?: string
          size?: number
        }
      }
      record?: any
    }
  }
  embed?: {
    $type?: string
    images?: Array<{
      alt: string
      thumb?: string
      fullsize?: string
      image?: {
        ref: {
          $link: string
        }
        mimeType: string
        size: number
      }
      aspectRatio?: {
        width: number
        height: number
      }
    }>
    external?: {
      uri: string
      title: string
      description: string
      thumb?: {
        ref?: {
          $link: string
        }
        mimeType?: string
        size?: number
      }
    }
    record?: any
  }
  replyCount?: number
  repostCount?: number
  likeCount?: number
  indexedAt: string
  reason?: {
    $type: string
    [key: string]: any
  }
}

interface BlueskyFeedResponse {
  feed: Array<{
    post: BlueskyPost
    reason?: {
      $type: string
      [key: string]: any
    }
  }>
  cursor?: string
}

export function useBlueskyFeed(limit: number = 5) {
  const [posts, setPosts] = useState<BlueskyPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBlueskyFeed() {
      try {
        setLoading(true)
        setError(null)

        // Primero obtener el perfil para obtener el DID
        const profileResponse = await fetch(
          `${BLUESKY_API_BASE}/app.bsky.actor.getProfile?actor=${BLUESKY_HANDLE}`
        )

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile')
        }

        const profileData = await profileResponse.json()
        const did = profileData.did

        // Luego obtener el feed del autor
        // Necesitamos obtener más posts para filtrar reposts después
        const feedResponse = await fetch(
          `${BLUESKY_API_BASE}/app.bsky.feed.getAuthorFeed?actor=${did}&limit=${limit * 3}`
        )

        if (!feedResponse.ok) {
          throw new Error('Failed to fetch feed')
        }

        const feedData: BlueskyFeedResponse = await feedResponse.json()
        
        // Extraer solo los posts originales del autor (filtrar reposts)
        // En Bluesky, los reposts tienen un campo "reason" en el feed item con $type que contiene "repost"
        const postsData = feedData.feed
          .filter((item) => {
            // Excluir items que tienen un "reason" - estos son reposts
            // El reason puede tener $type: 'app.bsky.feed.defs#reasonRepost'
            if (item.reason) {
              const reasonType = item.reason.$type || ''
              if (reasonType.includes('repost') || reasonType.includes('Repost')) {
                return false
              }
            }
            
            const post = item.post
            
            // Verificar que el autor del post sea el mismo que el perfil consultado
            if (post.author.did !== did) {
              return false
            }
            
            // Solo posts con texto
            if (!post.record || !post.record.text || post.record.text.length === 0) {
              return false
            }
            
            // Excluir si el post mismo tiene un reason (doble verificación)
            if (post.reason) {
              const reasonType = post.reason.$type || ''
              if (reasonType.includes('repost') || reasonType.includes('Repost')) {
                return false
              }
            }
            
            return true
          })
          .map((item) => {
            const post = item.post
            // Asegurar que el embed esté disponible tanto en post.embed como post.record.embed
            // La API puede devolver el embed en diferentes lugares
            if (!post.embed && post.record?.embed) {
              post.embed = post.record.embed
            }
            
            return post
          })
          .slice(0, limit) // Limitar al número solicitado

        setPosts(postsData)
      } catch (err) {
        console.error('Error fetching Bluesky feed:', err)
        setError(err instanceof Error ? err.message : 'Failed to load Bluesky feed')
      } finally {
        setLoading(false)
      }
    }

    fetchBlueskyFeed()
  }, [limit])

  return { posts, loading, error }
}
