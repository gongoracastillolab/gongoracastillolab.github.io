import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import pageHomeEs from '../data/page_home.json'
import pageHomeEn from '../data/page_home.en.json'
import pageResearchEs from '../data/page_research.json'
import pageResearchEn from '../data/page_research.en.json'
import piInfoEs from '../data/pi_info.json'
import piInfoEn from '../data/pi_info.en.json'
import projectsEs from '../data/projects.json'
import projectsEn from '../data/projects.en.json'
import outreachEs from '../data/outreach.json'
import outreachEn from '../data/outreach.en.json'

export type Locale = 'es' | 'en'

export function useLocalizedData() {
  const { i18n } = useTranslation()
  const lang = useMemo(
    () => ((i18n.language || 'es').split('-')[0] || 'es') as Locale,
    [i18n.language]
  )

  const home = lang === 'en' ? (pageHomeEn as Record<string, unknown>) : (pageHomeEs as Record<string, unknown>)
  const research = lang === 'en' ? (pageResearchEn as Record<string, unknown>) : (pageResearchEs as Record<string, unknown>)
  const pi = lang === 'en' ? (piInfoEn as Record<string, unknown>) : (piInfoEs as Record<string, unknown>)
  const projects = lang === 'en'
    ? (projectsEn as { projects: unknown[] }).projects
    : (projectsEs as { projects: unknown[] }).projects

  const outreach = lang === 'en'
    ? (outreachEn as { items: unknown[] }).items
    : (outreachEs as { items: unknown[] }).items

  return {
    lang,
    home,
    research,
    pi,
    projects,
    outreach,
  }
}
