import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Plus, UserPlus } from 'lucide-react'

const CORES_NIVEL = [
  'var(--color-nivel-1)',
  'var(--color-nivel-2)',
  'var(--color-nivel-3)',
  'var(--color-nivel-4)',
  'var(--color-nivel-5)',
  'var(--color-nivel-6)',
]

export function corDoNivel(nivel) {
  return CORES_NIVEL[Math.min(Math.max(nivel, 1), CORES_NIVEL.length) - 1]
}

function PessoaNode({ data, selected }) {
  const p = data.pessoa
  const cor = corDoNivel(p.nivel)
  const badge = [p.area, p.setor].filter(Boolean).join(' · ')

  // Etiquetas de empresa: respeita rigorosamente a ordem global definida no cadastro
  const empresaIdsSet = new Set(p.empresaIds ?? [])
  const etiquetas = data.mostrarEtiquetasEmpresa
    ? data.empresas && data.empresas.length > 0
      ? data.empresas.filter((e) => empresaIdsSet.has(e.id))
      : (p.empresaIds ?? []).map((id) => data.empresasPorId?.get(id)).filter(Boolean)
    : []

  return (
    <div
      className={`group relative w-60 rounded-xl border shadow-sm transition-shadow ${
        p.vagaAberta ? 'border-dashed bg-slate-50' : 'bg-white'
      } ${
        selected ? 'border-brand-600 shadow-md ring-2 ring-brand-200' : 'border-slate-200'
      }`}
      style={{ borderTopWidth: 4, borderTopColor: cor }}
      title={p.descricao || undefined}
    >
      {p.gestorId && <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />}
      <div className="px-3 py-2.5">
        {p.vagaAberta ? (
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold italic text-slate-400">
            <UserPlus size={14} /> Vaga em aberto
          </p>
        ) : (
          <p className="truncate text-sm font-semibold text-slate-900">{p.nome}</p>
        )}
        <p className="truncate text-xs font-medium text-slate-600">{p.cargo}</p>
        {badge && (
          <p className="mt-1 truncate text-[11px] text-slate-400">{badge}</p>
        )}
        {etiquetas.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {etiquetas.map((e) => (
              <span
                key={e.id}
                className="max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: e.cor }}
                title={e.nome}
              >
                {e.nome}
              </span>
            ))}
          </div>
        )}
        {p.descricao && (
          <p className="mt-1 line-clamp-5 whitespace-pre-line text-[11px] leading-snug text-slate-500">
            {p.descricao}
          </p>
        )}
      </div>
      {p.ehGestor && <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />}
      {p.ehGestor && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onAddSubordinado?.(p.id)
          }}
          className={`absolute -bottom-3.5 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-opacity hover:bg-brand-700 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          title={`Adicionar subordinado a ${p.nome}`}
          aria-label={`Adicionar subordinado a ${p.nome}`}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

export default memo(PessoaNode)
