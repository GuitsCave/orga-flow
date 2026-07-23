import { useState } from 'react'
import { Copy, X, Users, User, ArrowRight } from 'lucide-react'
import ModalBase from './ModalBase.jsx'

export default function ModalCopiarBloco({
  onFechar,
  pessoa,
  cenarios = [],
  cenarioAtivoId,
  onCopiar,
}) {
  const cenariosDestino = cenarios.filter((c) => c.id !== cenarioAtivoId)
  const [cenarioDestinoId, setCenarioDestinoId] = useState(cenariosDestino[0]?.id || '')
  const [incluirDescendentes, setIncluirDescendentes] = useState(true)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!cenarioDestinoId) return
    onCopiar({
      cenarioDestinoId,
      pessoaId: pessoa.id,
      incluirDescendentes,
    })
    onFechar()
  }

  return (
    <ModalBase onFechar={onFechar} larguraMax="max-w-md">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-brand-900">
            <Copy className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-800">Copiar Bloco / Equipe</h2>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Card do Bloco Selecionado */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-sm shrink-0">
              {pessoa.nome ? pessoa.nome.charAt(0).toUpperCase() : 'V'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Bloco Selecionado
              </div>
              <div className="font-bold text-slate-800 text-sm truncate">
                {pessoa.nome || 'Vaga em Aberto'}
              </div>
              <div className="text-xs text-slate-500 truncate">{pessoa.cargo}</div>
            </div>
          </div>

          {/* Destino */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Copiar para qual Organograma?
            </label>
            {cenariosDestino.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                Você ainda não possui outro organograma criado. Crie um novo organograma no menu do topo para poder copiar este bloco.
              </p>
            ) : (
              <select
                value={cenarioDestinoId}
                onChange={(e) => setCenarioDestinoId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-brand-500"
              >
                {cenariosDestino.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.dados?.pessoas?.length || 0} cargos)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Opção de Escopo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              O que deseja incluir?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIncluirDescendentes(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  !incluirDescendentes
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="h-5 w-5 text-brand-600" />
                <span className="text-xs">Apenas este cargo</span>
              </button>

              <button
                type="button"
                onClick={() => setIncluirDescendentes(true)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  incluirDescendentes
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="h-5 w-5 text-brand-600" />
                <span className="text-xs">Cargo + Equipe Inteira</span>
              </button>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cenariosDestino.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              Copiar Bloco <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
    </ModalBase>
  )
}
