/**
 * Permite solo etiquetas de formato inline seguras en títulos (p. ej. de Google Scholar).
 * Así se renderizan bien las cursivas <i>...</i> y negritas sin riesgo XSS.
 */
const ALLOWED_TAGS = ['i', 'em', 'b', 'strong']

export function sanitizeTitleHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tagName) => {
    const tag = tagName?.toLowerCase()
    return ALLOWED_TAGS.includes(tag) ? match : ''
  })
}
