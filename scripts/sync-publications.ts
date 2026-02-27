import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { load } from 'cheerio'
import puppeteer from 'puppeteer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GOOGLE_SCHOLAR_ID = "Rv6zyJ8AAAAJ"
const GOOGLE_SCHOLAR_PROFILE_URL = `https://scholar.google.com/citations?user=${GOOGLE_SCHOLAR_ID}&hl=en`
const EUROPE_PMC_API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

// Función para limpiar HTML de los abstracts
function cleanHtmlText(html: string): string {
  if (!html) return ''
  try {
    // Usar cheerio para parsear y extraer solo texto
    const $ = load(html)
    // Reemplazar tags de encabezados con saltos de línea y texto en negrita
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const text = $(el).text().trim()
      if (text) {
        $(el).replaceWith(`\n\n**${text}**\n\n`)
      } else {
        $(el).remove()
      }
    })
    // Reemplazar párrafos con saltos de línea
    $('p').each((_, el) => {
      const text = $(el).text().trim()
      if (text) {
        $(el).replaceWith(`\n\n${text}`)
      } else {
        $(el).remove()
      }
    })
    // Reemplazar breaks con saltos de línea
    $('br').replaceWith('\n')
    // Extraer texto y limpiar espacios múltiples
    let text = $.text()
    // Limpiar espacios múltiples y saltos de línea excesivos
    text = text
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Múltiples saltos de línea a dos
      .trim()
    return text
  } catch (error) {
    // Si falla el parsing, simplemente remover tags HTML básicos
    return html
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '') // Remover cualquier otro tag HTML
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim()
  }
}

interface GoogleScholarPub {
  title: string
  authors: string[]
  year: number
  journal?: string
  volume?: string
  pages?: string
  citations: number
  googleScholarId: string
  doi?: string
  scholarUrl?: string
}

interface EuropePMCResult {
  abstract?: string
  keywords?: string[]
  authors?: string[]
  pmid?: string
  doi?: string
  pdfUrl?: string
  journal?: string
  volume?: string
  pages?: string
  year?: number
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

// Búsqueda en Europe PMC (basado en scientific-article-aggregator)
async function searchEuropePMC(keywords: string[], maxResults: number = 1): Promise<any[]> {
  try {
    const query = keywords.join(' OR ')
    const url = `${EUROPE_PMC_API}?query=${encodeURIComponent(query)}&resultType=core&pageSize=${maxResults}&format=json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Europe PMC API error: ${response.status}`)
    }
    
    const data = await response.json() as { resultList?: { result?: any[] } }
    return data.resultList?.result || []
  } catch (error) {
    console.error('Error searching Europe PMC:', error)
    return []
  }
}

async function enrichWithEuropePMC(publication: GoogleScholarPub): Promise<EuropePMCResult & { year?: number }> {
  let query = ''
  
  if (publication.doi) {
    // Buscar por DOI (más preciso)
    query = `DOI:"${publication.doi}"`
  } else {
    // Buscar por título + primer autor
    const titleWords = publication.title.split(' ').slice(0, 5).join(' ')
    const firstAuthor = publication.authors[0]?.split(',')[0]?.trim() || publication.authors[0]?.trim() || ''
    query = `TITLE:"${titleWords}" AND AUTHOR:"${firstAuthor}"`
  }
  
  const results = await searchEuropePMC([query], 1)
  
  if (results.length > 0) {
    const result = results[0]
    const rawAbstract = result.abstractText || ''
    // Limpiar HTML del abstract
    const cleanAbstract = cleanHtmlText(rawAbstract)
    
    // Extraer año de Europe PMC si está disponible
    let year: number | undefined = undefined
    if (result.pubYear) {
      const pubYear = parseInt(result.pubYear, 10)
      if (!isNaN(pubYear) && pubYear >= 1900 && pubYear <= new Date().getFullYear()) {
        year = pubYear
      }
    }
    
    // Extraer autores completos de Europe PMC si están disponibles
    let authors: string[] | undefined = undefined
    if (result.authorString) {
      // authorString viene en formato "Last1 F1, Last2 F2, Last3 F3"
      authors = result.authorString
        .split(',')
        .map(a => a.trim())
        .filter(a => {
          const trimmed = a.trim().toLowerCase()
          return a.length > 0 && 
                 trimmed !== '...' && 
                 trimmed !== 'et al' && 
                 trimmed !== 'et al.' &&
                 !trimmed.startsWith('...')
        })
    }
    
    return {
      abstract: cleanAbstract,
      keywords: result.keywordList?.keyword || [],
      authors: authors, // Autores completos de Europe PMC
      pmid: result.pmid || '',
      doi: result.doi || publication.doi,
      pdfUrl: result.fullTextUrlList?.fullTextUrl?.[0]?.url || '',
      journal: result.journalTitle || publication.journal,
      volume: result.volume || publication.volume,
      pages: result.pageInfo || publication.pages,
      year: year // Año de Europe PMC si está disponible
    }
  }
  
  return {}
}

// Scraping de Google Scholar usando Puppeteer para renderizar JavaScript
// Google Scholar carga contenido dinámicamente, por lo que necesitamos un navegador real
async function fetchGoogleScholarPublications(): Promise<GoogleScholarPub[]> {
  let browser
  try {
    console.log(`📡 Fetching Google Scholar profile with Puppeteer: ${GOOGLE_SCHOLAR_PROFILE_URL}`)
    
    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    })
    
    const page = await browser.newPage()
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    // Navegar a la página
    console.log('   Loading page...')
    await page.goto(GOOGLE_SCHOLAR_PROFILE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    
    // Esperar a que las publicaciones se carguen
    console.log('   Waiting for publications to load...')
    try {
      await page.waitForSelector('tr.gsc_a_tr', { timeout: 15000 })
    } catch (e) {
      console.warn('   Standard selector not found, trying alternative...')
    }
    
    // Google Scholar usa un botón "Show more" para cargar más publicaciones
    // Necesitamos hacer clic repetidamente hasta que no haya más botones
    console.log('   Clicking "Show more" button to load all publications...')
    let previousCount = 0
    let currentCount = 0
    let clickAttempts = 0
    const maxClickAttempts = 20 // Máximo de clics (debería ser suficiente para ~50 publicaciones)
    
    while (clickAttempts < maxClickAttempts) {
      // Contar publicaciones actuales
      currentCount = await page.$$eval('tr.gsc_a_tr', (elements) => elements.length)
      console.log(`   Found ${currentCount} publications...`)
      
      // Buscar el botón "Show more" - Google Scholar puede usar diferentes selectores
      // Intentar múltiples selectores comunes
      const buttonSelectors = [
        'button#gsc_bpf_more',
        'a.gsc_bpf_more',
        'button[onclick*="gsc_bpf_more"]',
        'a[onclick*="gsc_bpf_more"]',
        'button[aria-label*="more"]',
        'a[aria-label*="more"]',
        'button:has-text("Show more")',
        'a:has-text("Show more")',
        '#gsc_bpf_more',
        '.gsc_bpf_more'
      ]
      
      let showMoreButton = null
      for (const selector of buttonSelectors) {
        try {
          showMoreButton = await page.$(selector)
          if (showMoreButton) {
            // Verificar que el botón sea visible
            const isVisible = await page.evaluate((el) => {
              // @ts-ignore
              const style = window.getComputedStyle(el)
              // @ts-ignore
              return el.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden'
            }, showMoreButton)
            if (isVisible) {
              console.log(`   Found "Show more" button with selector: ${selector}`)
              break
            }
            showMoreButton = null
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
      
      if (!showMoreButton) {
        console.log('   No "Show more" button found, trying scroll method...')
        // Si no hay botón, intentar hacer scroll hacia abajo
        await page.evaluate(() => {
          // @ts-ignore
          window.scrollTo(0, document.body.scrollHeight)
        })
        await page.waitForTimeout(2000)
        
        // Verificar si se cargaron más publicaciones después del scroll
        const newCount = await page.$$eval('tr.gsc_a_tr', (elements) => elements.length)
        if (newCount === currentCount && clickAttempts > 2) {
          console.log('   No more publications loading after scroll, stopping...')
          break
        }
        currentCount = newCount
      } else {
        // Hacer clic en el botón
        console.log(`   Clicking "Show more" button (attempt ${clickAttempts + 1})...`)
        try {
          await showMoreButton.click()
          // Esperar a que se carguen las nuevas publicaciones
          await page.waitForTimeout(3000) // Esperar más tiempo para que cargue
          
          // Verificar que se cargaron más publicaciones
          const newCount = await page.$$eval('tr.gsc_a_tr', (elements) => elements.length)
          if (newCount === currentCount) {
            console.log('   No new publications loaded, stopping...')
            break
          }
          currentCount = newCount
        } catch (clickError) {
          console.warn(`   Error clicking button: ${clickError}`)
          // Intentar con JavaScript click
          await page.evaluate(() => {
            // @ts-ignore
            const btn = document.querySelector('button#gsc_bpf_more, a.gsc_bpf_more')
            if (btn) {
              // @ts-ignore
              btn.click()
            }
          })
          await page.waitForTimeout(3000)
        }
      }
      
      // Si no hay cambios después de varios intentos, salir
      if (currentCount === previousCount && clickAttempts > 3) {
        console.log('   No progress after multiple attempts, stopping...')
        break
      }
      
      previousCount = currentCount
      clickAttempts++
    }
    
    console.log(`   Finished loading. Total publications found: ${currentCount}`)
    
    // Extraer datos directamente con Puppeteer para obtener citas correctamente
    console.log('   Extracting publication data with Puppeteer...')
    const publicationsData = await page.evaluate((scholarId) => {
      // @ts-ignore
      const rows = document.querySelectorAll('tr.gsc_a_tr')
      const publications: any[] = []
      
      rows.forEach((row: any, index: number) => {
        try {
          // Obtener todas las celdas (td) - estructura identificada:
          // cells[0] (gsc_a_t): Título, autores y journal
          // cells[1] (gsc_a_c): Número de citas
          // cells[2] (gsc_a_y): Año
          const cells = Array.from(row.querySelectorAll('td')) as any[]
          
          if (cells.length < 2) {
            console.warn(`Row ${index} has less than 2 cells, skipping`)
            return
          }
          
          // Celda 0 (gsc_a_t): Título, autores y journal
          const titleCell = cells[0] as any
          const titleLink = titleCell?.querySelector('a.gsc_a_at')
          const title = titleLink?.textContent?.trim() || ''
          
          if (!title || title.length < 5) return
          
          // URL y Google Scholar ID
          const citationUrl = titleLink?.getAttribute('href') || ''
          const googleScholarIdMatch = citationUrl.match(/citation_for_view=([^&]+)/)
          const googleScholarId = googleScholarIdMatch?.[1] || `gs-${Date.now()}-${index}`
          
          // Extraer autores y journal de los divs dentro de la celda 0
          const grayDivs = titleCell.querySelectorAll('div.gs_gray')
          const authorsText = grayDivs[0]?.textContent?.trim() || ''
          const journalInfo = grayDivs[1]?.textContent?.trim() || ''
          
          // Validar que authorsText no sea vacío y que journalInfo no contenga solo autores
          // Si el segundo div contiene solo nombres (sin números de journal), es probable que sea un error
          const hasJournalNumbers = journalInfo && /\d/.test(journalInfo)
          const hasAuthorPattern = journalInfo && /^[A-Z][a-z]+\s+[A-Z]/.test(journalInfo) && !hasJournalNumbers
          
          // Si journalInfo parece contener solo autores, usar solo el primer div para autores
          let finalAuthorsText = authorsText
          let finalJournalInfo = journalInfo
          
          if (hasAuthorPattern && !hasJournalNumbers) {
            // El segundo div contiene autores, no journal - concatenar con el primero
            finalAuthorsText = authorsText ? `${authorsText}, ${journalInfo}` : journalInfo
            finalJournalInfo = ''
          }
          
          // Parsear autores - filtrar "..." y otros marcadores de truncamiento
          const authors = finalAuthorsText 
            ? finalAuthorsText
                .split(',')
                .map((a: string) => a.trim())
                .filter((a: string) => {
                  // Filtrar marcadores de truncamiento comunes
                  const trimmed = a.trim().toLowerCase()
                  return a.length > 0 && 
                         trimmed !== '...' && 
                         trimmed !== 'et al' && 
                         trimmed !== 'et al.' &&
                         !trimmed.startsWith('...')
                })
            : []
          
          // Celda 2 (gsc_a_y): Año - leer PRIMERO de la celda 2 (más confiable)
          let year: number | null = null
          const currentYearValue = new Date().getFullYear()
          
          if (cells.length > 2) {
            const yearCell = cells[2] as any
            const yearText = yearCell?.textContent?.trim() || ''
            
            if (yearText) {
              const yearMatch = yearText.match(/\b(19\d{2}|20[0-2]\d)\b/)
              if (yearMatch) {
                const candidateYear = parseInt(yearMatch[1], 10)
                if (candidateYear >= 1900 && candidateYear <= currentYearValue) {
                  year = candidateYear
                }
              }
            }
          }
          
          // Si no se encontró año en la celda 2, buscar en journalInfo (fallback)
          if (year === null && finalJournalInfo) {
            const yearPattern = /\b(19\d{2}|20[0-2]\d)\b/
            const journalYearMatch = finalJournalInfo.match(yearPattern)
            if (journalYearMatch) {
              const candidateYear = parseInt(journalYearMatch[1], 10)
              if (candidateYear >= 1900 && candidateYear <= currentYearValue && candidateYear <= 3000) {
                year = candidateYear
              }
            }
          }
          
          // Celda 1 (gsc_a_c): Citas - leer directamente el texto de la celda o del enlace
          // IMPORTANTE: Validar que no sea un año (1900-2026) ni un número muy grande (probablemente página)
          let citations = 0
          if (cells.length > 1) {
            const citationsCell = cells[1] as any
            const citationsLink = citationsCell?.querySelector('a.gsc_a_ac')
            const citationsText = citationsLink?.textContent?.trim() || citationsCell?.textContent?.trim() || ''
            
            if (citationsText) {
              const citationsMatch = citationsText.match(/(\d+)/)
              if (citationsMatch) {
                const candidateCitations = parseInt(citationsMatch[1], 10)
                // Validar que no sea un año (1900-2026) ni un número muy grande (probablemente página o ID)
                if (candidateCitations >= 1900 && candidateCitations <= currentYearValue) {
                  // Es probablemente un año, no citas - dejar en 0
                  citations = 0
                } else if (candidateCitations > 10000) {
                  // Número muy grande, probablemente página o ID - dejar en 0
                  citations = 0
                } else {
                  citations = candidateCitations
                }
              }
            }
          }
          
          // Journal - extraer del journalInfo, removiendo el año si está presente
          let journal = finalJournalInfo || ''
          
          // Remover el año del final si está presente
          if (journal && year) {
            journal = journal.replace(new RegExp(`,\\s*${year}|\\s+${year}$`), '').trim()
            journal = journal.replace(/^,\s*|,\s*$/g, '').trim()
          }
          
          // Remover cualquier año que quede en el journal
          journal = journal.replace(/\b(19\d{2}|20[0-2]\d)\b/g, '').trim()
          journal = journal.replace(/^,\s*|,\s*$/g, '').trim()
          
          // Si el journal contiene solo números o está vacío, intentar extraer el nombre antes del primer número
          if (!journal || journal.length < 3 || /^\d+/.test(journal)) {
            // Intentar tomar la primera parte antes de cualquier número de volumen
            const parts = finalJournalInfo.split(/\d+/)
            journal = parts[0]?.trim() || ''
            journal = journal.replace(/^,\s*|,\s*$/g, '').trim()
            
            // Si aún está vacío o parece contener solo autores, intentar buscar patrones de journal
            if (!journal || journal.length < 3) {
              // Buscar patrones comunes de journals (palabras capitalizadas seguidas de números)
              const journalMatch = finalJournalInfo.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/)
              if (journalMatch) {
                journal = journalMatch[1].trim()
              }
            }
          }
          
          // Limpiar journal de caracteres extraños y validar que no contenga solo autores
          if (journal) {
            // Remover patrones que parezcan nombres de autores al inicio
            journal = journal.replace(/^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*/, '')
            journal = journal.trim()
          }
          
          // Validación final del año
          const finalYear = (year === null || isNaN(year) || year < 1900 || year > currentYearValue || year > 3000) 
            ? currentYearValue 
            : year
          
          // URL completa
          const scholarUrl = citationUrl.startsWith('http')
            ? citationUrl
            : citationUrl
              ? `https://scholar.google.com${citationUrl}`
              : `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${scholarId}&citation_for_view=${googleScholarId}`
          
          publications.push({
            title,
            authors,
            year: finalYear,
            journal: journal || undefined,
            citations,
            googleScholarId,
            scholarUrl
          })
        } catch (err) {
          console.warn(`Error parsing row ${index}:`, err)
        }
      })
      
      return publications
    }, GOOGLE_SCHOLAR_ID)
    
    console.log(`   Extracted ${publicationsData.length} publications with Puppeteer`)
    
    // Convertir a nuestro formato
    const publications: GoogleScholarPub[] = publicationsData.map((pub: any) => ({
      title: pub.title,
      authors: pub.authors,
      year: pub.year,
      journal: pub.journal,
      citations: pub.citations,
      googleScholarId: pub.googleScholarId,
      scholarUrl: pub.scholarUrl
    }))
    
    // Si Puppeteer no capturó publicaciones, usar cheerio como respaldo
    if (publications.length === 0) {
      console.log('   Puppeteer extraction returned 0, falling back to cheerio parsing...')
      const html = await page.content()
      const $cheerio = load(html)
      const publicationRows = $cheerio('tr.gsc_a_tr')
      console.log(`   Parsing ${publicationRows.length} publication rows from HTML...`)
      
      publicationRows.each((index, element) => {
        try {
          const $el = $cheerio(element)
          
          // Título y URL - múltiples selectores posibles
          const titleLink = $el.find('a.gsc_a_at').first()
          let title = titleLink.text().trim()
          
          // Si no encontramos título con el selector principal, intentar alternativos
          if (!title || title.length < 5) {
            const altTitleLink = $el.find('a[href*="citation_for_view"]').first()
            title = altTitleLink.text().trim()
            if (!title || title.length < 5) {
              // Último intento: buscar cualquier enlace en la fila
              const anyLink = $el.find('a').first()
              title = anyLink.text().trim()
              if (!title || title.length < 5) {
                console.warn(`   ⚠️ Skipping row ${index}: no valid title found`)
                return
              }
            }
          }
          
          // Obtener URL de la cita - usar el mismo enlace que usamos para el título
          const citationUrl = titleLink.attr('href') || 
                             $el.find('a[href*="citation_for_view"]').first().attr('href') || 
                             $el.find('a').first().attr('href') || ''
          const googleScholarIdMatch = citationUrl.match(/citation_for_view=([^&]+)/)
          const googleScholarId = googleScholarIdMatch?.[1] || `gs-${Date.now()}-${index}`
          
          // Autores y detalles - múltiples selectores
          const grayTexts = $el.find('div.gs_gray, div.gsc_a_t').map((_, el) => $cheerio(el).text().trim()).get()
          const authors = grayTexts[0] ? grayTexts[0].split(',').map(a => a.trim()).filter(a => a.length > 0) : []
          
          // Journal, año, volumen, páginas (segundo div o en el texto completo)
          const journalInfo = grayTexts[1] || grayTexts[0] || ''
          
          // Extraer año del journalInfo o del título
          const yearMatch = journalInfo.match(/(\d{4})/) || title.match(/(\d{4})/)
          const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
          
          // Extraer journal (todo antes del año o antes de la coma)
          let journal = journalInfo.split(/\d{4}/)[0]?.trim() || ''
          if (!journal && journalInfo) {
            // Intentar extraer journal de diferentes formas
            const parts = journalInfo.split(',')
            journal = parts[0]?.trim() || ''
          }
          
          // Citas - múltiples formas de obtenerlas
          let citations = 0
          
          // Método 1: Enlace de citas con clase gsc_a_c
          const citationsLink = $el.find('a.gsc_a_c').first()
          const citationsText = citationsLink.text().trim()
          
          if (citationsText) {
            // Puede ser "Cited by 123" o solo "123" o "123*"
            const citationsMatch = citationsText.match(/(\d+)/)
            if (citationsMatch) {
              citations = parseInt(citationsMatch[1], 10)
            }
          }
          
          // Método 2: Buscar en el atributo onclick o data
          if (citations === 0) {
            const onclickAttr = citationsLink.attr('onclick') || ''
            const onclickMatch = onclickAttr.match(/(\d+)/)
            if (onclickMatch) {
              citations = parseInt(onclickMatch[1], 10)
            }
          }
          
          // Método 3: Buscar en el texto completo del row
          if (citations === 0) {
            const rowText = $el.text()
            const rowCitationsMatch = rowText.match(/Cited by\s*(\d+)/i) || rowText.match(/(\d+)\s*cit/i)
            if (rowCitationsMatch) {
              citations = parseInt(rowCitationsMatch[1], 10)
            }
          }
          
          // Construir URL completa de Google Scholar
          let scholarUrl = citationUrl.startsWith('http')
            ? citationUrl
            : citationUrl
              ? `https://scholar.google.com${citationUrl}`
              : `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${GOOGLE_SCHOLAR_ID}&citation_for_view=${googleScholarId}`
          
          // Intentar extraer DOI del título o detalles (a veces aparece)
          let doi: string | undefined
          const doiMatch = journalInfo.match(/DOI[:\s]+([0-9.]+)\/([0-9a-zA-Z-]+)/i) || 
                          title.match(/DOI[:\s]+([0-9.]+)\/([0-9a-zA-Z-]+)/i)
          if (doiMatch) {
            doi = `${doiMatch[1]}/${doiMatch[2]}`
          }
          
          publications.push({
            title,
            authors: authors.length > 0 ? authors : ['Unknown'],
            year: isNaN(year) ? new Date().getFullYear() : year,
            journal: journal || undefined,
            citations,
            googleScholarId,
            doi,
            scholarUrl
          })
        } catch (err) {
          console.warn(`⚠️ Error parsing publication ${index}:`, err)
          // Continuar con la siguiente publicación
        }
      })
      
      // Si no encontramos publicaciones con el selector estándar, intentar selector alternativo
      if (publications.length === 0) {
        console.log('   Trying alternative selectors...')
        
        // Selector alternativo 1: Buscar en tbody tr
        $cheerio('tbody tr').each((index, element) => {
          try {
            const $el = $cheerio(element)
            const titleLink = $el.find('a[href*="citation_for_view"]').first()
            const title = titleLink.text().trim()
            
            if (!title || title.length < 10) return // Skip si no parece un título válido
            
            const citationUrl = titleLink.attr('href') || ''
            const googleScholarIdMatch = citationUrl.match(/citation_for_view=([^&]+)/)
            const googleScholarId = googleScholarIdMatch?.[1] || `gs-alt-${Date.now()}-${index}`
            
            // Buscar información adicional en el mismo row
            const rowText = $el.text()
            
            // Autores - buscar patrón común
            const authorsMatch = rowText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)/)
            const authors = authorsMatch 
              ? authorsMatch[1]
                  .split(',')
                  .map(a => a.trim())
                  .filter(a => {
                    const trimmed = a.trim().toLowerCase()
                    return a.length > 0 && 
                           trimmed !== '...' && 
                           trimmed !== 'et al' && 
                           trimmed !== 'et al.' &&
                           !trimmed.startsWith('...')
                  })
              : ['Unknown']
            
            // Año
            const yearMatch = rowText.match(/(\d{4})/)
            const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
            
            // Citas - múltiples patrones
            let citations = 0
            const citationsMatch = rowText.match(/Cited by\s*(\d+)/i) || 
                                   rowText.match(/(\d+)\s*cit/i) ||
                                   rowText.match(/\[(\d+)\]/)
            if (citationsMatch) {
              citations = parseInt(citationsMatch[1], 10)
            }
            
            // Journal
            const journalMatch = rowText.match(/([A-Z][^,]+(?:,\s*[A-Z][^,]+)*),\s*\d{4}/)
            const journal = journalMatch ? journalMatch[1].trim() : undefined
            
            const scholarUrl = citationUrl.startsWith('http')
              ? citationUrl
              : citationUrl
                ? `https://scholar.google.com${citationUrl}`
                : `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${GOOGLE_SCHOLAR_ID}&citation_for_view=${googleScholarId}`
            
            // Evitar duplicados
            const isDuplicate = publications.some(p => 
              p.title.toLowerCase() === title.toLowerCase() || 
              p.googleScholarId === googleScholarId
            )
            
            if (!isDuplicate) {
              publications.push({
                title,
                authors,
                year: isNaN(year) ? new Date().getFullYear() : year,
                journal,
                citations,
                googleScholarId,
                scholarUrl
              })
            }
          } catch (err) {
            console.warn(`⚠️ Error parsing publication (alt) ${index}:`, err)
          }
        })
      }
    }
    
    // Eliminar duplicados por título o googleScholarId
    const uniquePublications = publications.filter((pub, index, self) =>
      index === self.findIndex(p => 
        p.title.toLowerCase() === pub.title.toLowerCase() || 
        p.googleScholarId === pub.googleScholarId
      )
    )
    
    console.log(`✅ Parsed ${publications.length} publications, ${uniquePublications.length} unique after deduplication`)
    
    if (uniquePublications.length === 0) {
      console.warn('⚠️ No publications found. This might be due to:')
      console.warn('   1. Google Scholar blocking automated requests (most likely)')
      console.warn('   2. Google Scholar loads content dynamically with JavaScript')
      console.warn('   3. Changes in Google Scholar HTML structure')
      console.warn('   4. Rate limiting')
      console.warn('')
      console.warn('   Solutions:')
      console.warn('   - Use puppeteer/playwright for full JavaScript rendering')
      console.warn('   - Use manual publications.json for now')
      console.warn('   - Consider using Google Scholar API alternatives if available')
    } else if (uniquePublications.length < 10) {
      console.warn('⚠️ Only a few publications found. Google Scholar may be blocking or using dynamic loading.')
      console.warn('   Consider using puppeteer/playwright for complete scraping.')
    }
    
    return uniquePublications
  } catch (error) {
    console.error('❌ Error fetching Google Scholar publications with Puppeteer:', error)
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`)
    }
    console.log('   Attempting fallback with simple fetch...')
    
    // Fallback: intentar con fetch simple
    try {
      return await fetchGoogleScholarPublicationsFallback()
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError)
      console.error('   Using existing publications.json')
      return []
    }
  } finally {
    // Cerrar el navegador si está abierto
    if (browser) {
      await browser.close().catch(() => {
        // Ignorar errores al cerrar
      })
    }
  }
}

// Método fallback usando fetch simple (sin JavaScript)
async function fetchGoogleScholarPublicationsFallback(): Promise<GoogleScholarPub[]> {
  console.log('   Using fallback fetch method (may only get first 20 publications)')
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Referer': 'https://scholar.google.com/'
  }
  
  const response = await fetch(GOOGLE_SCHOLAR_PROFILE_URL, { headers })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const html = await response.text()
  const $ = load(html)
  
  const publications: GoogleScholarPub[] = []
  
  // Usar el mismo parsing que antes
  $('tr.gsc_a_tr').each((index, element) => {
    try {
      const $el = $(element)
      const titleLink = $el.find('a.gsc_a_at').first()
      const title = titleLink.text().trim()
      
      if (!title || title.length < 5) return
      
      const citationUrl = titleLink.attr('href') || ''
      const googleScholarIdMatch = citationUrl.match(/citation_for_view=([^&]+)/)
      const googleScholarId = googleScholarIdMatch?.[1] || `gs-fallback-${Date.now()}-${index}`
      
      const grayTexts = $el.find('div.gs_gray, div.gsc_a_t').map((_, el) => $(el).text().trim()).get()
      const authors = grayTexts[0] 
        ? grayTexts[0]
            .split(',')
            .map(a => a.trim())
            .filter(a => {
              const trimmed = a.trim().toLowerCase()
              return a.length > 0 && 
                     trimmed !== '...' && 
                     trimmed !== 'et al' && 
                     trimmed !== 'et al.' &&
                     !trimmed.startsWith('...')
            })
        : []
      const journalInfo = grayTexts[1] || grayTexts[0] || ''
      
      const yearMatch = journalInfo.match(/(\d{4})/) || title.match(/(\d{4})/)
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
      
      let journal = journalInfo.split(/\d{4}/)[0]?.trim() || ''
      if (!journal && journalInfo) {
        journal = journalInfo.split(',')[0]?.trim() || ''
      }
      
      let citations = 0
      const citationsLink = $el.find('a.gsc_a_c').first()
      const citationsText = citationsLink.text().trim()
      
      if (citationsText) {
        const citationsMatch = citationsText.match(/(\d+)/)
        if (citationsMatch) {
          citations = parseInt(citationsMatch[1], 10)
        }
      }
      
      const scholarUrl = citationUrl.startsWith('http')
        ? citationUrl
        : citationUrl
          ? `https://scholar.google.com${citationUrl}`
          : `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${GOOGLE_SCHOLAR_ID}&citation_for_view=${googleScholarId}`
      
      publications.push({
        title,
        authors: authors.length > 0 ? authors : ['Unknown'],
        year: isNaN(year) ? new Date().getFullYear() : year,
        journal: journal || undefined,
        citations,
        googleScholarId,
        scholarUrl
      })
    } catch (err) {
      console.warn(`⚠️ Error parsing publication (fallback) ${index}:`, err)
    }
  })
  
  return publications
}

function generatePublicationId(title: string, year: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
  return `pub-${year}-${slug}`
}

function mergePublications(newPubs: Publication[], existingPubs: Publication[]): Publication[] {
  // Si no hay datos nuevos (ej. sync falló en CI), devolver existentes sin tocar
  if (newPubs.length === 0) {
    return [...existingPubs].sort((a, b) => b.year - a.year)
  }
  // Preservar publicaciones manuales (source: 'manual')
  const manualPubs = existingPubs.filter(p => p.source === 'manual')
  
  // Crear mapa de publicaciones existentes por múltiples criterios para búsqueda rápida
  // Prioridad: googleScholarId > DOI > título
  const existingMapById = new Map<string, Publication>() // Por googleScholarId
  const existingMapByDoi = new Map<string, Publication>() // Por DOI
  const existingMapByTitle = new Map<string, Publication>() // Por título
  
  existingPubs.forEach(pub => {
    if (pub.googleScholarId) {
      existingMapById.set(pub.googleScholarId, pub)
    }
    if (pub.doi) {
      existingMapByDoi.set(pub.doi.toLowerCase(), pub)
    }
    const titleKey = pub.title.toLowerCase().trim()
    existingMapByTitle.set(titleKey, pub)
  })
  
  // Crear un Set para rastrear IDs ya procesados
  const processedIds = new Set<string>()
  
  // Inicializar merged con publicaciones manuales solamente
  // Las demás se agregarán/actualizarán desde newPubs
  const merged: Publication[] = manualPubs.map(pub => ({ ...pub }))
  manualPubs.forEach(pub => processedIds.add(pub.id))
  
  // Procesar nuevas publicaciones
  let addedCount = 0
  let updatedCount = 0
  let skippedCount = 0
  
  for (const newPub of newPubs) {
    // Buscar duplicado por googleScholarId (más confiable), DOI o título
    let existing: Publication | null = null
    
    if (newPub.googleScholarId) {
      existing = existingMapById.get(newPub.googleScholarId) || null
    }
    
    if (!existing && newPub.doi) {
      existing = existingMapByDoi.get(newPub.doi.toLowerCase()) || null
    }
    
    if (!existing) {
      existing = existingMapByTitle.get(newPub.title.toLowerCase().trim()) || null
    }
    
    if (existing && existing.source !== 'manual') {
      // Encontrar índice en merged si ya existe
      const existingIndex = merged.findIndex(p => p.id === existing!.id)
      
      if (existingIndex >= 0) {
        // Actualizar existente en merged - IMPORTANTE: usar newPub primero para sobrescribir datos incorrectos
        merged[existingIndex] = {
          ...newPub, // Nuevos datos primero (año y citas correctos)
          id: existing.id, // Preservar ID existente (aunque tenga año incorrecto en el ID)
          tags: existing.tags || newPub.tags, // Preservar tags manuales
          featured: existing.featured !== undefined ? existing.featured : newPub.featured,
          lastUpdated: new Date().toISOString()
        }
        updatedCount++
      } else {
        // Agregar existente actualizado a merged (primera vez que se encuentra)
        merged.push({
          ...newPub, // Nuevos datos primero
          id: existing.id, // Preservar ID existente
          tags: existing.tags || newPub.tags,
          featured: existing.featured !== undefined ? existing.featured : newPub.featured,
          lastUpdated: new Date().toISOString()
        })
        processedIds.add(existing.id)
        addedCount++
      }
    } else if (!existing) {
      // Agregar nueva publicación que no existe en existingPubs
      const pubId = newPub.id || generatePublicationId(newPub.title, newPub.year)
      if (!processedIds.has(pubId)) {
        merged.push({
          ...newPub,
          id: pubId,
          lastUpdated: new Date().toISOString()
        })
        processedIds.add(pubId)
        addedCount++
      } else {
        skippedCount++
      }
    } else {
      // existing.source === 'manual', no hacer nada (ya está en merged)
      skippedCount++
    }
  }
  
  console.log(`   Merge stats: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`)
  
  // Ordenar por año descendente
  return merged.sort((a, b) => b.year - a.year)
}

async function main() {
  console.log('🔄 Starting publications sync...')
  console.log(`📚 Google Scholar Profile: ${GOOGLE_SCHOLAR_PROFILE_URL}`)
  
  // 1. Obtener publicaciones de Google Scholar
  const gsPublications = await fetchGoogleScholarPublications()
  console.log(`📚 Found ${gsPublications.length} publications from Google Scholar`)
  
  // 2. Enriquecer con Europe PMC (con delay para evitar rate limits)
  const enrichedPublications: Publication[] = []
  
  for (const pub of gsPublications) {
    console.log(`   Enriching: ${pub.title.substring(0, 50)}...`)
    const enrichment = await enrichWithEuropePMC(pub)
    
    // Usar año de Europe PMC si está disponible y el de Google Scholar no es válido
    const finalYear = enrichment.year || (pub.year && pub.year >= 1900 && pub.year <= new Date().getFullYear() && pub.year <= 3000 ? pub.year : undefined)
    
    if (!finalYear) {
      console.warn(`   ⚠️ No valid year found for: "${pub.title.substring(0, 50)}..."`)
    }
    
    enrichedPublications.push({
      id: generatePublicationId(pub.title, finalYear || new Date().getFullYear()),
      title: pub.title,
      // Usar autores de Europe PMC si están disponibles (más completos), sino usar los de Google Scholar
      authors: enrichment.authors && enrichment.authors.length > 0 ? enrichment.authors : pub.authors,
      year: finalYear || new Date().getFullYear(), // Fallback solo si realmente no hay año
      journal: enrichment.journal || pub.journal,
      volume: enrichment.volume || pub.volume,
      pages: enrichment.pages || pub.pages,
      doi: enrichment.doi || pub.doi,
      pmid: enrichment.pmid,
      googleScholarId: pub.googleScholarId,
      abstract: enrichment.abstract,
      keywords: enrichment.keywords,
      citations: pub.citations,
      pdfUrl: enrichment.pdfUrl,
      pubmedUrl: enrichment.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${enrichment.pmid}` : undefined,
      scholarUrl: pub.scholarUrl,
      source: enrichment.abstract ? 'hybrid' : 'google_scholar',
      lastUpdated: new Date().toISOString()
    })
    
    // Delay de 200ms entre requests para evitar rate limits
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  // 3. Cargar existentes (para preservar datos manuales)
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'publications.json')
  let existing: { publications: Publication[] } = { publications: [] }
  
  try {
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf-8')
      const parsed = JSON.parse(fileContent)
      existing = {
        publications: Array.isArray(parsed.publications) ? parsed.publications : []
      }
      console.log(`📂 Loaded ${existing.publications.length} existing publications`)
    }
  } catch (error) {
    console.warn('⚠️ Could not load existing publications, starting fresh:', error)
    existing = { publications: [] }
  }
  
  // 4. Merge (preservar manuales, actualizar automáticos)
  console.log(`🔄 Merging ${enrichedPublications.length} new publications with ${existing.publications.length} existing...`)
  const merged = mergePublications(enrichedPublications, existing.publications)
  console.log(`✅ After merge: ${merged.length} total publications`)
  
  if (merged.length === 0 && enrichedPublications.length > 0) {
    console.error(`\n❌ ERROR: Merge returned 0 publications but we had ${enrichedPublications.length} new publications!`)
    console.error(`   This suggests a problem in mergePublications function`)
  }
  
  // 5. Guardar
  const output = {
    publications: merged,
    lastSync: new Date().toISOString(),
    totalCount: merged.length,
    metadata: {
      googleScholarProfile: GOOGLE_SCHOLAR_ID,
      lastGoogleScholarSync: gsPublications.length > 0 ? new Date().toISOString() : undefined,
      lastEuropePmcSync: enrichedPublications.some(p => p.abstract) ? new Date().toISOString() : undefined
    }
  }
  
  fs.mkdirSync(path.dirname(dataPath), { recursive: true })
  fs.writeFileSync(dataPath, JSON.stringify(output, null, 2))
  
  console.log(`✅ Synced ${merged.length} publications`)
  console.log(`   - Manual: ${merged.filter(p => p.source === 'manual').length}`)
  console.log(`   - Hybrid: ${merged.filter(p => p.source === 'hybrid').length}`)
  console.log(`   - Google Scholar only: ${merged.filter(p => p.source === 'google_scholar').length}`)
  console.log(`   - Europe PMC only: ${merged.filter(p => p.source === 'europe_pmc').length}`)
  
  if (merged.length === 0 && enrichedPublications.length > 0) {
    console.warn(`\n   ⚠️ WARNING: No publications in merged array!`)
    console.warn(`   - New publications: ${enrichedPublications.length}`)
    console.warn(`   - Existing publications: ${existing.publications.length}`)
  }
}

main().catch((error) => {
  console.error('❌ Error in sync script:', error)
  process.exit(1)
})
