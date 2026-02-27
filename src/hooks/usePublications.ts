import { useState, useEffect } from 'react'
import type { Publication, PublicationsData } from '../types/publications'

/** Base path para recursos estáticos: en producción se obtiene de la URL del módulo (más fiable que el DOM). */
function getDataBaseUrl(): string {
  if (import.meta.env.DEV) return import.meta.env.BASE_URL || '/'
  try {
    // En build, el chunk está en /assets/ o /<base>/assets/; el base es el directorio padre
    const base = new URL('..', import.meta.url).pathname
    return base.endsWith('/') ? base : base + '/'
  } catch (_) {
    return import.meta.env.BASE_URL || '/'
  }
}

export function usePublications() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<PublicationsData['metadata'] | null>(null)

  useEffect(() => {
    async function fetchPublications() {
      try {
        setLoading(true)
        setError(null)

        const baseUrl = getDataBaseUrl()
        const cacheBuster = import.meta.env.DEV ? `?t=${Date.now()}` : ''
        const response = await fetch(`${baseUrl}data/publications.json${cacheBuster}`)

        if (!response.ok) {
          throw new Error('Failed to fetch publications')
        }

        const data: PublicationsData = await response.json()
        
        setPublications(data.publications)
        setMetadata(data.metadata)
      } catch (err) {
        console.error('Error fetching publications:', err)
        setError(err instanceof Error ? err.message : 'Failed to load publications')
      } finally {
        setLoading(false)
      }
    }

    fetchPublications()
  }, [])

  return { publications, loading, error, metadata }
}
