/**
 * Sincroniza publicaciones desde Europe PMC (PubMed) únicamente.
 * Sin Puppeteer/Chromium: apto para CI (GitHub Actions).
 *
 * Uso: npm run sync:publications
 * Fuente: Europe PMC API por autor (AUTHOR:"...").
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { load } from 'cheerio'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const EUROPE_PMC_API = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'
const EUROPE_PMC_AUTHOR_QUERY = 'AUTHOR:"Góngora-Castillo"'
const PAGE_SIZE = 100
const REQUEST_DELAY_MS = 200

function cleanHtmlText(html: string): string {
  if (!html) return ''
  try {
    const $ = load(html)
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim()
      $(el).replaceWith(text ? `\n\n**${text}**\n\n` : '')
    })
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      $(el).replaceWith(text ? `\n\n${text}` : '')
    })
    $('br').replaceWith('\n')
    let text = $.text()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim()
    return text
  } catch {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

interface Publication {
  id: string
  title: string
  authors: string[]
  year: number
  journal?: string
  volume?: string
  pages?: string
  doi?: string
  pmid?: string
  googleScholarId?: string
  abstract?: string
  keywords?: string[]
  citations?: number
  pdfUrl?: string
  pubmedUrl?: string
  scholarUrl?: string
  tags?: string[]
  featured?: boolean
  lastUpdated: string
  source: 'google_scholar' | 'europe_pmc' | 'manual' | 'hybrid'
}

interface EuropePMCResult {
  id?: string
  pmid?: string
  pmcid?: string
  doi?: string
  title?: string
  authorString?: string
  journalTitle?: string
  journalVolume?: string
  pageInfo?: string
  pubYear?: string
  abstractText?: string
  keywordList?: { keyword?: string[] }
  citedByCount?: number
  fullTextUrlList?: { fullTextUrl?: Array<{ url?: string; documentStyle?: string }> }
}

interface EuropePMCSearchResponse {
  hitCount?: number
  nextCursorMark?: string
  resultList?: { result?: EuropePMCResult[] }
}

async function fetchAllFromEuropePMC(authorQuery: string): Promise<EuropePMCResult[]> {
  const all: EuropePMCResult[] = []
  let cursorMark: string = '*'

  do {
    const params = new URLSearchParams({
      query: authorQuery,
      resultType: 'core',
      pageSize: String(PAGE_SIZE),
      format: 'json',
      cursorMark,
    })
    const url = `${EUROPE_PMC_API}?${params.toString()}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Europe PMC API error: ${res.status}`)
    const data = (await res.json()) as EuropePMCSearchResponse
    const results = data.resultList?.result ?? []
    all.push(...results)
    cursorMark = data.nextCursorMark ?? ''
    if (results.length < PAGE_SIZE || !cursorMark) break
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
  } while (cursorMark)

  return all
}

function parseAuthors(authorString: string | undefined): string[] {
  if (!authorString) return []
  return authorString
    .split(',')
    .map((a) => a.trim())
    .filter((a) => {
      const t = a.toLowerCase()
      return a.length > 0 && t !== '...' && t !== 'et al' && t !== 'et al.' && !t.startsWith('...')
    })
}

function generatePublicationId(title: string, year: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
  return `pub-${year}-${slug}`
}

function mapEuropePMCToPublication(r: EuropePMCResult): Publication {
  const year =
    r.pubYear != null
      ? parseInt(r.pubYear, 10)
      : new Date().getFullYear()
  const safeYear =
    !Number.isNaN(year) && year >= 1900 && year <= new Date().getFullYear()
      ? year
      : new Date().getFullYear()
  const title = (r.title ?? '').trim() || 'Sin título'
  const authors = parseAuthors(r.authorString)
  const pdfUrl = r.fullTextUrlList?.fullTextUrl?.find(
    (u) => u.documentStyle === 'pdf' || (u.url && u.url.includes('pdf'))
  )?.url ?? r.fullTextUrlList?.fullTextUrl?.[0]?.url
  const abstract = r.abstractText ? cleanHtmlText(r.abstractText) : undefined

  return {
    id: generatePublicationId(title, safeYear),
    title,
    authors: authors.length > 0 ? authors : ['Unknown'],
    year: safeYear,
    journal: r.journalTitle?.trim() || undefined,
    volume: r.journalVolume?.trim() || undefined,
    pages: r.pageInfo?.trim() || undefined,
    doi: r.doi?.trim() || undefined,
    pmid: r.pmid?.trim() || undefined,
    abstract,
    keywords: r.keywordList?.keyword?.length ? r.keywordList.keyword : undefined,
    citations: r.citedByCount != null ? r.citedByCount : undefined,
    pdfUrl: pdfUrl?.trim() || undefined,
    pubmedUrl: r.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}` : undefined,
    lastUpdated: new Date().toISOString(),
    source: 'europe_pmc',
  }
}

function mergePublications(
  newPubs: Publication[],
  existingPubs: Publication[]
): Publication[] {
  if (newPubs.length === 0) {
    return [...existingPubs].sort((a, b) => b.year - a.year)
  }

  const manualPubs = existingPubs.filter((p) => p.source === 'manual')
  const byDoi = new Map<string, Publication>()
  const byPmid = new Map<string, Publication>()
  const byTitle = new Map<string, Publication>()
  existingPubs.forEach((p) => {
    if (p.doi) byDoi.set(p.doi.toLowerCase(), p)
    if (p.pmid) byPmid.set(p.pmid, p)
    byTitle.set(p.title.toLowerCase().trim(), p)
  })

  const merged: Publication[] = manualPubs.map((p) => ({ ...p }))
  const processedIds = new Set<string>(manualPubs.map((p) => p.id))

  for (const newPub of newPubs) {
    const existing =
      (newPub.doi && byDoi.get(newPub.doi.toLowerCase())) ??
      (newPub.pmid && byPmid.get(newPub.pmid)) ??
      byTitle.get(newPub.title.toLowerCase().trim()) ??
      null

    if (existing && existing.source !== 'manual') {
      const existingInMerged = merged.find((m) => m.id === existing.id)
      const updated = {
        ...newPub,
        id: existing.id,
        tags: existing.tags ?? newPub.tags,
        featured: existing.featured ?? newPub.featured,
        googleScholarId: existing.googleScholarId,
        scholarUrl: existing.scholarUrl,
        lastUpdated: new Date().toISOString(),
      }
      if (existingInMerged) {
        const idx = merged.indexOf(existingInMerged)
        merged[idx] = updated
      } else {
        merged.push(updated)
      }
      processedIds.add(existing.id)
    } else if (!existing) {
      const id = newPub.id || generatePublicationId(newPub.title, newPub.year)
      if (!processedIds.has(id)) {
        merged.push({ ...newPub, id, lastUpdated: new Date().toISOString() })
        processedIds.add(id)
      }
    }
  }

  return merged.sort((a, b) => b.year - a.year)
}

async function main() {
  console.log('🔄 Sync publications (Europe PMC only)...')
  console.log(`   Query: ${EUROPE_PMC_AUTHOR_QUERY}`)

  const results = await fetchAllFromEuropePMC(EUROPE_PMC_AUTHOR_QUERY)
  console.log(`📚 Europe PMC returned ${results.length} results`)

  const newPublications = results.map(mapEuropePMCToPublication)

  const dataPath = path.join(__dirname, '..', 'public', 'data', 'publications.json')
  let existing: { publications: Publication[] } = { publications: [] }
  try {
    if (fs.existsSync(dataPath)) {
      const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
      existing = {
        publications: Array.isArray(raw.publications) ? raw.publications : [],
      }
      console.log(`📂 Loaded ${existing.publications.length} existing publications`)
    }
  } catch {
    existing = { publications: [] }
  }

  const merged = mergePublications(newPublications, existing.publications)
  console.log(`✅ After merge: ${merged.length} total`)

  const output = {
    publications: merged,
    lastSync: new Date().toISOString(),
    totalCount: merged.length,
    metadata: {
      europePmcAuthorQuery: EUROPE_PMC_AUTHOR_QUERY,
      lastEuropePmcSync: new Date().toISOString(),
    },
  }

  fs.mkdirSync(path.dirname(dataPath), { recursive: true })
  fs.writeFileSync(dataPath, JSON.stringify(output, null, 2))

  console.log(`   - Europe PMC: ${merged.filter((p) => p.source === 'europe_pmc').length}`)
  console.log(`   - Manual: ${merged.filter((p) => p.source === 'manual').length}`)
}

main().catch((err) => {
  console.error('❌ Sync failed:', err)
  process.exit(1)
})
