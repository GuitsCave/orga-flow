import { useEffect } from 'react'

/**
 * Overlay padrão dos modais: escurece o fundo, fecha ao clicar fora e no Escape.
 * `larguraMax` é uma classe Tailwind de max-width (ex.: 'max-w-lg').
 */
export default function ModalBase({ onFechar, children, larguraMax = 'max-w-lg' }) {
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onFechar}
    >
      <div
        className={`w-full ${larguraMax} rounded-2xl bg-white p-6 shadow-2xl transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
