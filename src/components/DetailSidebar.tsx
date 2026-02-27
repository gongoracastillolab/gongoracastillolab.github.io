import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function DetailSidebar({ isOpen, onClose, title, children }: DetailSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sidebar: panel fijo sin scroll; el scroll va en el contenedor interior */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex-shrink-0 bg-white border-b border-pale-slate px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium text-charcoal-blue">{title}</h2>
              <button
                onClick={onClose}
                className="text-charcoal-blue hover:text-cobalt-blue transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
