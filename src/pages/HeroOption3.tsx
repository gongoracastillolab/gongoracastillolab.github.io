import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const FRAME_COUNT = 82
const MS_PER_FRAME = 150
const BASE_FILENAME = '2026-02-11.Ondas editado'

export default function HeroOption3() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [visibleLayer, setVisibleLayer] = useState(0) // 0 o 1: qué img está encima
  const [loaded, setLoaded] = useState(false)
  const baseUrl = (import.meta as any).env.BASE_URL || '/'
  const frameUrls = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const num = String(i).padStart(3, '0')
    const name = `${BASE_FILENAME}_${num}.png`
    return `${baseUrl}hero-option3-frames/${encodeURIComponent(name)}`
  })

  const nextFrame = (currentFrame + 1) % FRAME_COUNT

  // Preload images
  useEffect(() => {
    let cancelled = false
    const images = frameUrls.map((src) => {
      const img = new Image()
      img.src = src
      return img
    })
    Promise.all(images.map((img) => new Promise((res) => { img.onload = res; img.onerror = res })))
      .then(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Loop: 0 → 1 → … → 36 → 0. Doble buffer: la capa oculta ya tiene el siguiente frame cargado.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentFrame((f) => (f + 1) % FRAME_COUNT)
      setVisibleLayer((v) => 1 - v)
    }, MS_PER_FRAME)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-charcoal-blue">
      {/* Doble buffer: dos imágenes; la visible muestra el frame actual, la otra precarga el siguiente. */}
      <div className="absolute inset-0">
        <img
          src={visibleLayer === 0 ? frameUrls[currentFrame] : frameUrls[nextFrame]}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ pointerEvents: 'none', zIndex: visibleLayer === 0 ? 1 : 0 }}
        />
        <img
          src={visibleLayer === 1 ? frameUrls[currentFrame] : frameUrls[nextFrame]}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ pointerEvents: 'none', zIndex: visibleLayer === 1 ? 1 : 0 }}
        />
      </div>

      {/* Overlay suave para legibilidad del texto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(50,62,78,0.35) 0%, transparent 40%, transparent 70%, rgba(50,62,78,0.5) 100%)',
        }}
      />

      {/* Contenido del hero */}
      <div className="relative z-10 flex min-h-[90vh] flex-col justify-center">
        <div className="container-custom py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl space-y-5"
          >
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/90">
              Hero Opción 3
            </p>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight">
              Una esfera 3D de nuestras publicaciones y sus redes de citación
            </h1>
            <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-2xl">
              Secuencia animada a partir de frames para dar sensación de movimiento.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Indicador de carga (opcional) */}
      {!loaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-charcoal-blue/80">
          <p className="text-white/80 text-sm">Cargando secuencia…</p>
        </div>
      )}
    </section>
  )
}
