import { useState, useEffect } from 'react'
import type { Publication, PublicationsData } from '../types/publications'

// Importación en build: el JSON se incluye en el bundle y evita 404 en producción (GitHub Pages).
import publicationsDataJson from '../../public/data/publications.json'

const data = publicationsDataJson as PublicationsData

export function usePublications() {
  const [publications, setPublications] = useState<Publication[]>(data.publications ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<PublicationsData['metadata'] | null>(data.metadata ?? null)

  // En desarrollo, recargar desde la URL para ver cambios en el JSON sin reiniciar
  useEffect(() => {
    if (!import.meta.env.DEV) return
    let cancelled = false
    setLoading(true)
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}data/publications.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch'))))
      .then((d: PublicationsData) => {
        if (!cancelled) {
          setPublications(d.publications ?? [])
          setMetadata(d.metadata ?? null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load publications')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { publications, loading, error, metadata }
}
