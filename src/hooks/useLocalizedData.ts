import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import pageHomeI18n from '../data/page_home.json'
import pageResearchI18n from '../data/page_research.json'
import piInfoI18n from '../data/pi_info.json'
import projectsI18n from '../data/projects.json'
import outreachI18n from '../data/outreach.json'

export type Locale = 'es' | 'en'

type I18nRecord = Record<string, Record<string, unknown>>

export function useLocalizedData() {
  const { i18n } = useTranslation()
  const lang = useMemo(
    () => ((i18n.language || 'es').split('-')[0] || 'es') as Locale,
    [i18n.language]
  )

  const home = (pageHomeI18n as I18nRecord)[lang] as Record<string, unknown>
  const research = (pageResearchI18n as I18nRecord)[lang] as Record<string, unknown>
  const pi = (piInfoI18n as I18nRecord)[lang] as Record<string, unknown>

  type ProjectsByLocale = Record<Locale, { projects: Array<{ id: string; image?: string; status?: string; [k: string]: unknown }> }>
  const projectsByLocale = projectsI18n as ProjectsByLocale
  const projectsEsList = projectsByLocale.es.projects
  const projectsEnList = projectsByLocale.en.projects
  const projects =
    lang === 'en'
      ? projectsEnList.map((pen: { id: string; image?: string; status?: string; [k: string]: unknown }) => {
          const esProject = projectsEsList.find((p) => p.id === pen.id)
          return { ...pen, image: esProject?.image ?? pen.image, status: esProject?.status ?? pen.status }
        })
      : projectsEsList

  type OutreachByLocale = Record<Locale, { items: Array<{ id: string; image?: string; images?: unknown[]; [k: string]: unknown }> }>
  const outreachByLocale = outreachI18n as OutreachByLocale
  const outreachEsItems = outreachByLocale.es.items
  const outreachEnItems = outreachByLocale.en.items
  const outreach =
    lang === 'en'
      ? outreachEnItems.map((enItem: { id: string; image?: string; images?: unknown[]; [k: string]: unknown }) => {
          const esItem = outreachEsItems.find((i) => i.id === enItem.id)
          return {
            ...enItem,
            image: esItem?.image ?? enItem.image,
            images: esItem?.images ?? enItem.images,
          }
        })
      : outreachEsItems

  return {
    lang,
    home,
    research,
    pi,
    projects,
    outreach,
  }
}
