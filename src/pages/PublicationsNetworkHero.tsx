import { motion } from 'framer-motion'
import { useState } from 'react'
import PublicationSphere from '../components/PublicationSphere'
import { usePublications } from '../hooks/usePublications'
import type { Publication } from '../types/publications'

export default function PublicationsNetworkHero() {
  const { publications } = usePublications()
  const [selectedDoi, setSelectedDoi] = useState<string | null>(null)
  const [cardPositionIndex, setCardPositionIndex] = useState<number>(0)

  const selectedPublication: Publication | null =
    selectedDoi ? publications.find((p) => p.doi === selectedDoi) ?? null : null

  const cardAlignClass =
    cardPositionIndex % 3 === 0
      ? 'items-start pt-10'
      : cardPositionIndex % 3 === 1
        ? 'items-center'
        : 'items-end pb-10'

  return (
    <section className="relative min-h-[90vh] bg-white-smoke overflow-hidden">
      {/* Esfera de publicaciones ocupando todo el hero */}
      <div className="absolute inset-0">
        <PublicationSphere
          onOwnNodeClick={(doi) => {
            setSelectedDoi(doi)
            setCardPositionIndex((prev) => prev + 1)
          }}
          onBackgroundClick={() => setSelectedDoi(null)}
        />
      </div>

      {/* Contenido del hero: sin pointer-events para que la esfera sea interactiva debajo */}
      <div className="relative z-10 pointer-events-none">
        <div className="container-custom py-20 lg:py-28 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl space-y-5"
          >
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-cobalt-blue">
              Visualización de impacto científico
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-charcoal-blue leading-tight">
              Una esfera 3D de nuestras publicaciones y sus redes de citación
            </h1>
            <p className="text-base md:text-lg text-charcoal-blue/85 leading-relaxed max-w-2xl">
              Visualización interactiva de la red de citaciones construida a partir de nuestras
              publicaciones, sus referencias y los artículos que nos citan.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tarjeta de publicación seleccionada */}
      {selectedPublication && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.35 }}
          className={`pointer-events-none absolute inset-y-0 right-0 flex pr-6 md:pr-10 ${cardAlignClass}`}
        >
          <div className="pointer-events-auto max-w-sm w-full rounded-3xl bg-gradient-to-br from-white/95 via-white/90 to-[#f4f4f7] shadow-2xl shadow-slate-300/40 border border-white/60 backdrop-blur-xl px-7 py-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-charcoal-blue/60">
              <span className="font-semibold uppercase tracking-[0.18em] text-cobalt-blue/90">
                GCLab Publications
              </span>
              {selectedPublication.year && (
                <span className="rounded-full bg-white/90 px-3 py-1 border border-pale-slate text-[11px] font-medium text-charcoal-blue/70">
                  {selectedPublication.year}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-charcoal-blue leading-snug line-clamp-3">
                {selectedPublication.title}
              </h2>
              {selectedPublication.journal && (
                <p className="text-xs text-charcoal-blue/70">
                  {selectedPublication.journal}
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs text-charcoal-blue/70">
              {selectedPublication.authors?.length > 0 && (
                <p className="line-clamp-2">
                  <span className="font-semibold text-charcoal-blue/80">Autores: </span>
                  {selectedPublication.authors.join(', ')}
                </p>
              )}
              {selectedPublication.citations !== undefined && (
                <p>
                  <span className="font-semibold text-charcoal-blue/80">Citas: </span>
                  {selectedPublication.citations}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col text-[11px] text-charcoal-blue/60">
                {selectedPublication.doi && (
                  <span className="truncate max-w-[180px]">
                    DOI: {selectedPublication.doi}
                  </span>
                )}
                {selectedPublication.source && (
                  <span className="mt-0.5 capitalize">
                    Fuente: {selectedPublication.source.replace('_', ' ')}
                  </span>
                )}
              </div>
              {selectedPublication.pdfUrl || selectedPublication.scholarUrl || selectedPublication.pubmedUrl ? (
                <a
                  href={
                    selectedPublication.pdfUrl ||
                    selectedPublication.scholarUrl ||
                    selectedPublication.pubmedUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-charcoal-blue text-white shadow-md hover:bg-cobalt-blue transition-colors"
                >
                  <span className="text-xs font-semibold">Go</span>
                </a>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  )
}

