import { useState, useEffect } from 'react'
import type { Publication, PublicationsData } from '../types/publications'

const baseUrl = import.meta.env.BASE_URL

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

        // Agregar timestamp para evitar caché en desarrollo
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
