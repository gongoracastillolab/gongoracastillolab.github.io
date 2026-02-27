/**
 * Convierte un email para mostrar en pantalla: si ya está escrito con " at " se
 * muestra tal cual; si tiene "@", se reemplaza por " at " para dificultar scraping.
 */
export function emailToDisplayText(email: string | null | undefined): string {
  if (email == null || typeof email !== 'string') return ''
  const trimmed = email.trim()
  if (/\s+at\s+/i.test(trimmed)) return trimmed
  return trimmed.replace('@', ' at ')
}

/**
 * Devuelve el email con "@" para usarlo en href mailto: (si en el CMS está
 * escrito " at ", se normaliza a @ para que el enlace funcione).
 */
export function emailToMailtoHref(email: string | null | undefined): string {
  if (email == null || typeof email !== 'string') return ''
  return email.trim().replace(/\s+at\s+/gi, '@')
}
