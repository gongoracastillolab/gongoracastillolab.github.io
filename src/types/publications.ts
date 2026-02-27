export interface Publication {
  id: string
  title: string
  authors: string[]
  year: number
  journal?: string
  volume?: string
  pages?: string
  
  // Identificadores
  doi?: string
  pmid?: string
  googleScholarId?: string
  
  // Contenido extendido
  abstract?: string
  keywords?: string[]
  
  // Métricas
  citations?: number
  altmetricScore?: number
  
  // Enlaces
  pdfUrl?: string
  pubmedUrl?: string
  scholarUrl?: string
  
  // Metadata
  tags?: string[]
  featured?: boolean
  lastUpdated: string
  source: 'google_scholar' | 'europe_pmc' | 'manual' | 'hybrid'
}

export interface PublicationsData {
  publications: Publication[]
  lastSync: string
  totalCount: number
  metadata: {
    googleScholarProfile: string
    lastGoogleScholarSync?: string
    lastEuropePmcSync?: string
  }
}

export type SortOption = 'year' | 'citations' | 'title'
export type SortOrder = 'asc' | 'desc'
