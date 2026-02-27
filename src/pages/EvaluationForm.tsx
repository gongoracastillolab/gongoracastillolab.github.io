import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, MessageSquare } from 'lucide-react'

type Rating = 'de_acuerdo' | 'neutral' | 'en_desacuerdo' | ''

const PAGES = [
  { id: 'inicio', path: '/', labelKey: 'nav.home' },
  { id: 'people', path: '/people', labelKey: 'nav.people' },
  { id: 'research', path: '/research', labelKey: 'nav.research' },
  { id: 'publications', path: '/publications', labelKey: 'nav.publications' },
  { id: 'outreach', path: '/outreach', labelKey: 'nav.outreach' },
] as const

const ITEMS_PER_PAGE = [
  'eval.info_correcta',
  'eval.layout_adecuado',
  'eval.navegacion_clara',
  'eval.elementos_visuales',
] as const

type FormState = {
  [K in (typeof PAGES)[number]['id']]: { [key: string]: Rating }
} & { comentarios: string }

const initialState: FormState = {
  inicio: Object.fromEntries(ITEMS_PER_PAGE.map((k) => [k, ''])) as { [key: string]: Rating },
  people: Object.fromEntries(ITEMS_PER_PAGE.map((k) => [k, ''])) as { [key: string]: Rating },
  research: Object.fromEntries(ITEMS_PER_PAGE.map((k) => [k, ''])) as { [key: string]: Rating },
  publications: Object.fromEntries(ITEMS_PER_PAGE.map((k) => [k, ''])) as { [key: string]: Rating },
  outreach: Object.fromEntries(ITEMS_PER_PAGE.map((k) => [k, ''])) as { [key: string]: Rating },
  comentarios: '',
}

export default function EvaluationForm() {
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(initialState)
  const [submitted, setSubmitted] = useState(false)

  const setRating = (pageId: (typeof PAGES)[number]['id'], itemKey: string, value: Rating) => {
    setForm((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], [itemKey]: value },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    // Aquí podrías enviar a un backend o abrir mailto con el resumen
    const summary = JSON.stringify(form, null, 2)
    console.log('Evaluación enviada:', summary)
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white-smoke">
        <div className="container-custom py-16 text-center">
          <CheckCircle className="w-16 h-16 text-cobalt-blue mx-auto mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal-blue mb-2">
            {t('eval.thanks')}
          </h2>
          <p className="text-charcoal-blue/80 max-w-md mx-auto">{t('eval.thanksMessage')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white-smoke min-h-screen">
      <div className="container-custom py-12 md:py-16">
        <header className="text-center mb-12">
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal-blue mb-2">
            {t('eval.title')}
          </h1>
          <p className="text-charcoal-blue/80 max-w-2xl mx-auto">{t('eval.intro')}</p>
        </header>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-10">
          {PAGES.map((page) => (
            <section
              key={page.id}
              className="bg-white rounded-xl shadow-sm border border-border-gray p-6 md:p-8"
            >
              <h2 className="font-serif text-xl md:text-2xl text-charcoal-blue mb-6 pb-2 border-b border-border-gray">
                {t(page.labelKey)}
              </h2>
              <ul className="space-y-5">
                {ITEMS_PER_PAGE.map((itemKey) => (
                  <li key={itemKey} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <span className="text-charcoal-blue font-medium sm:min-w-[200px] sm:flex-1">
                      {t(itemKey)}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {(['de_acuerdo', 'neutral', 'en_desacuerdo'] as const).map((value) => (
                        <label
                          key={value}
                          className="inline-flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`${page.id}-${itemKey}`}
                            checked={form[page.id][itemKey] === value}
                            onChange={() => setRating(page.id, itemKey, value)}
                            className="w-4 h-4 text-cobalt-blue border-border-gray focus:ring-cobalt-blue"
                          />
                          <span className="text-sm text-charcoal-blue">{t(`eval.${value}`)}</span>
                        </label>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="bg-white rounded-xl shadow-sm border border-border-gray p-6 md:p-8">
            <h2 className="font-serif text-xl md:text-2xl text-charcoal-blue mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cobalt-blue" />
              {t('eval.comentariosTitle')}
            </h2>
            <p className="text-charcoal-blue/80 text-sm mb-4">{t('eval.comentariosDesc')}</p>
            <textarea
              name="comentarios"
              value={form.comentarios}
              onChange={(e) => setForm((prev) => ({ ...prev, comentarios: e.target.value }))}
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-border-gray text-charcoal-blue placeholder-charcoal-blue/50 focus:ring-2 focus:ring-cobalt-blue/30 focus:border-cobalt-blue outline-none transition-colors"
              placeholder={t('eval.comentariosPlaceholder')}
            />
          </section>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-8 py-3">
              {t('eval.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
