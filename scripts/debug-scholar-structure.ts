import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GOOGLE_SCHOLAR_PROFILE_URL = 'https://scholar.google.com/citations?user=Rv6zyJ8AAAAJ&hl=en'
const GOOGLE_SCHOLAR_ID = 'Rv6zyJ8AAAAJ'

interface DebugRow {
  index: number
  title: string
  titleLink?: string
  allCells: string[]
  allDivs: string[]
  allLinks: Array<{ text: string; href: string; className: string }>
  citationsLink?: { text: string; href: string; className: string }
  yearCell?: string
  rawHTML: string
  structured: {
    title?: string
    authors?: string[]
    journal?: string
    year?: number
    citations?: number
    volume?: string
    pages?: string
  }
}

async function debugGoogleScholarStructure() {
  console.log('🔍 Starting Google Scholar structure debugging...')
  console.log(`📚 Profile: ${GOOGLE_SCHOLAR_PROFILE_URL}`)
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    
    console.log('   Loading page...')
    await page.goto(GOOGLE_SCHOLAR_PROFILE_URL, { waitUntil: 'networkidle2' })
    
    // Esperar a que carguen las publicaciones
    await page.waitForSelector('tr.gsc_a_tr', { timeout: 10000 })
    console.log('   Publications loaded')
    
    // Cargar todas las publicaciones haciendo clic en "Show more"
    let previousCount = 0
    let currentCount = 0
    let clickAttempts = 0
    
    while (clickAttempts < 10) {
      currentCount = await page.$$eval('tr.gsc_a_tr', (elements) => elements.length)
      console.log(`   Found ${currentCount} publications...`)
      
      const showMoreButton = await page.$('button#gsc_bpf_more')
      if (showMoreButton) {
        const isVisible = await page.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return el.offsetParent !== null && style.display !== 'none' && style.visibility !== 'hidden'
        }, showMoreButton)
        
        if (isVisible && currentCount > previousCount) {
          console.log(`   Clicking "Show more" (attempt ${clickAttempts + 1})...`)
          await showMoreButton.click()
          await page.waitForTimeout(3000)
          previousCount = currentCount
          clickAttempts++
        } else {
          break
        }
      } else {
        break
      }
    }
    
    console.log(`   Total publications: ${currentCount}`)
    
    // Extraer estructura completa de cada fila
    console.log('   Extracting structure from each row...')
    const debugData: DebugRow[] = await page.evaluate((scholarId) => {
      const rows = document.querySelectorAll('tr.gsc_a_tr')
      const results: DebugRow[] = []
      
      rows.forEach((row: any, index: number) => {
        try {
          // Título y enlace
          const titleLink = row.querySelector('a.gsc_a_at')
          const title = titleLink?.textContent?.trim() || ''
          const titleLinkHref = titleLink?.getAttribute('href') || ''
          
          // Todas las celdas (td)
          const cells = Array.from(row.querySelectorAll('td')).map((cell: any) => {
            return {
              index: Array.from(row.querySelectorAll('td')).indexOf(cell),
              text: cell.textContent?.trim() || '',
              html: cell.innerHTML?.substring(0, 200) || '',
              className: cell.className || ''
            }
          })
          
          // Todos los divs
          const divs = Array.from(row.querySelectorAll('div')).map((div: any) => {
            return {
              text: div.textContent?.trim() || '',
              className: div.className || '',
              html: div.innerHTML?.substring(0, 150) || ''
            }
          })
          
          // Todos los enlaces
          const links = Array.from(row.querySelectorAll('a')).map((link: any) => {
            return {
              text: link.textContent?.trim() || '',
              href: link.getAttribute('href') || '',
              className: link.className || ''
            }
          })
          
          // Enlace de citas específico
          const citationsLink = row.querySelector('a.gsc_a_c')
          const citationsLinkData = citationsLink ? {
            text: citationsLink.textContent?.trim() || '',
            href: citationsLink.getAttribute('href') || '',
            className: citationsLink.className || ''
          } : undefined
          
          // Buscar celda que contenga el año (última columna típicamente)
          const allCells = Array.from(row.querySelectorAll('td'))
          let yearCell: string | undefined = undefined
          if (allCells.length > 0) {
            // La última celda suele contener el año
            const lastCell = allCells[allCells.length - 1]
            const lastCellText = lastCell.textContent?.trim() || ''
            if (lastCellText.match(/\b(19\d{2}|20[0-2]\d)\b/)) {
              yearCell = lastCellText
            }
          }
          
          // Intentar extraer datos estructurados
          const grayDivs = row.querySelectorAll('div.gs_gray, div.gsc_a_t')
          const authorsText = grayDivs[0]?.textContent?.trim() || ''
          const journalInfo = grayDivs[1]?.textContent?.trim() || ''
          
          // Extraer citas
          let citations: number | undefined = undefined
          if (citationsLink) {
            const citationsText = citationsLink.textContent?.trim() || ''
            const citationsMatch = citationsText.match(/(\d+)/)
            if (citationsMatch) {
              citations = parseInt(citationsMatch[1], 10)
            }
          }
          
          // Extraer año
          let year: number | undefined = undefined
          const yearPattern = /\b(19\d{2}|20[0-2]\d)\b/
          if (yearCell) {
            const yearMatch = yearCell.match(yearPattern)
            if (yearMatch) {
              year = parseInt(yearMatch[1], 10)
            }
          } else {
            const journalYearMatch = journalInfo.match(yearPattern)
            if (journalYearMatch) {
              year = parseInt(journalYearMatch[1], 10)
            }
          }
          
          // HTML crudo de la fila (limitado)
          const rawHTML = row.innerHTML?.substring(0, 500) || ''
          
          results.push({
            index,
            title,
            titleLink: titleLinkHref,
            allCells: cells.map(c => `[${c.index}] "${c.text}" (class: ${c.className})`),
            allDivs: divs.map(d => `"${d.text}" (class: ${d.className})`),
            allLinks: links,
            citationsLink: citationsLinkData,
            yearCell,
            rawHTML,
            structured: {
              title,
              authors: authorsText ? authorsText.split(',').map(a => a.trim()) : [],
              journal: journalInfo,
              year,
              citations,
              volume: undefined,
              pages: undefined
            }
          })
        } catch (err) {
          console.error(`Error processing row ${index}:`, err)
        }
      })
      
      return results
    }, GOOGLE_SCHOLAR_ID)
    
    console.log(`   Extracted structure from ${debugData.length} publications`)
    
    // Generar CSV
    const csvRows: string[] = []
    csvRows.push('Index,Title,Authors,Journal,Year,Citations,TitleLink,CitationsLinkText,CitationsLinkHref,YearCell,CellCount,DivCount,LinkCount')
    
    debugData.forEach((row) => {
      const authors = row.structured.authors?.join('; ') || ''
      const journal = (row.structured.journal || '').replace(/"/g, '""')
      const title = row.title.replace(/"/g, '""')
      const citationsLinkText = row.citationsLink?.text || ''
      const citationsLinkHref = row.citationsLink?.href || ''
      
      csvRows.push([
        row.index,
        `"${title}"`,
        `"${authors}"`,
        `"${journal}"`,
        row.structured.year || '',
        row.structured.citations || '',
        `"${row.titleLink || ''}"`,
        `"${citationsLinkText}"`,
        `"${citationsLinkHref}"`,
        `"${row.yearCell || ''}"`,
        row.allCells.length,
        row.allDivs.length,
        row.allLinks.length
      ].join(','))
    })
    
    const csvPath = path.join(__dirname, '..', 'debug-scholar-structure.csv')
    fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf-8')
    console.log(`✅ CSV saved to: ${csvPath}`)
    
    // Generar JSON detallado
    const jsonPath = path.join(__dirname, '..', 'debug-scholar-structure.json')
    fs.writeFileSync(jsonPath, JSON.stringify(debugData, null, 2), 'utf-8')
    console.log(`✅ JSON saved to: ${jsonPath}`)
    
    // Mostrar resumen de las primeras 5
    console.log('\n📊 Summary of first 5 publications:')
    debugData.slice(0, 5).forEach((row) => {
      console.log(`\n   Publication ${row.index + 1}:`)
      console.log(`      Title: "${row.title.substring(0, 60)}..."`)
      console.log(`      Authors: ${row.structured.authors?.slice(0, 3).join(', ') || 'N/A'}...`)
      console.log(`      Journal: "${row.structured.journal?.substring(0, 50) || 'N/A'}..."`)
      console.log(`      Year: ${row.structured.year || 'NOT FOUND'}`)
      console.log(`      Citations: ${row.structured.citations || 'NOT FOUND'}`)
      console.log(`      Citations Link Text: "${row.citationsLink?.text || 'NOT FOUND'}"`)
      console.log(`      Year Cell: "${row.yearCell || 'NOT FOUND'}"`)
      console.log(`      Cells: ${row.allCells.length} (${row.allCells.slice(0, 2).join(' | ')})`)
      console.log(`      Divs: ${row.allDivs.length} (${row.allDivs.slice(0, 2).join(' | ')})`)
      console.log(`      Links: ${row.allLinks.length}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await browser.close()
  }
}

debugGoogleScholarStructure().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
