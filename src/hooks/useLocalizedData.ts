import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import pageHomeI18n from '../data/page_home.json'
import pageResearchI18n from '../data/page_research.json'
import piInfoI18n from '../data/pi_info.json'
import projectsI18n from '../data/projects.json'
import outreachI18n from '../data/outreach.json'

export type Locale = 'es' | 'en'

// Decap CMS single_file i18n: default locale (es) at root, other locales under key "en"
function getDefaultLocaleContent<T extends Record<string, unknown>>(data: T): Omit<T, 'en'> {
  const { en: _en, ...rest } = data
  return rest as Omit<T, 'en'>
}

export function useLocalizedData() {
  const { i18n } = useTranslation()
  const lang = useMemo(
    () => ((i18n.language || 'es').split('-')[0] || 'es') as Locale,
    [i18n.language]
  )

  const pageHome = pageHomeI18n as Record<string, unknown> & { en?: Record<string, unknown> }
  const home = (lang === 'en' ? pageHome.en : getDefaultLocaleContent(pageHome)) as Record<string, unknown>

  const pageResearch = pageResearchI18n as Record<string, unknown> & { en?: Record<string, unknown> }
  const research = (lang === 'en' ? pageResearch.en : getDefaultLocaleContent(pageResearch)) as Record<string, unknown>

  const piInfo = piInfoI18n as Record<string, unknown> & { en?: Record<string, unknown> }
  const pi = (lang === 'en' ? piInfo.en : getDefaultLocaleContent(piInfo)) as Record<string, unknown>

  type ProjectItem = { id: string; image?: string; status?: string; [k: string]: unknown }
  type ProjectsData = { es: { projects: ProjectItem[] }; en: { projects: ProjectItem[] } }
  const projectsData = projectsI18n as ProjectsData
  const projectsEsList = projectsData.es.projects
  const projectsEnList = projectsData.en.projects
  const projects =
    lang === 'en'
      ? projectsEnList.map((pen: ProjectItem) => {
          const esProject = projectsEsList.find((p) => p.id === pen.id)
          return { ...pen, image: esProject?.image ?? pen.image, status: esProject?.status ?? pen.status }
        })
      : projectsEsList

  type OutreachItem = { id: string; image?: string; images?: unknown[]; [k: string]: unknown }
  type OutreachData = { es: { items: OutreachItem[] }; en: { items: OutreachItem[] } }
  const outreachData = outreachI18n as OutreachData
  const outreachEsItems = outreachData.es.items
  const outreachEnItems = outreachData.en.items
  const outreach =
    lang === 'en'
      ? outreachEnItems.map((enItem: OutreachItem) => {
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
