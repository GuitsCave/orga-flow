import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Copy,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react'

export default function CenarioSelector({
  cenarios = [],
  cenarioAtivo,
  onSelecionarCenario,
  onAbrirNovoCenario,
  onAbrirRenomearCenario,
  onDuplicarCenario,
  onExcluirCenario,
}) {
  const [aberto, setAberto] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const menuRef = useRef(null)

  // Fechar menu ao clicar fora
  useEffect(() => {
    function aoClicarFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAberto(false)
        setConfirmandoExclusao(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  return (
    <div data-tour="cenarios" className="relative shrink-0" ref={menuRef}>
      {/* Botão Compacto do Seletor */}
      <button
        type="button"
        onClick={() => {
          setAberto((v) => !v)
          setConfirmandoExclusao(false)
        }}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
        title={`Alternar Organogramas / Cenários (${cenarios.length} salvos) - Atual: ${cenarioAtivo?.nome || 'Organograma'}`}
      >
        <FolderTree className="h-4 w-4 text-brand-600 shrink-0" />
        <span className="hidden sm:inline text-xs font-semibold text-slate-700">Cenários</span>
        <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-800">
          {cenarios.length}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menu Suspenso */}
      {aberto && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
            Meus Organogramas ({cenarios.length})
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
            {cenarios.map((c) => {
              const ativo = c.id === cenarioAtivo?.id
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelecionarCenario(c.id)
                    setAberto(false)
                  }}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                    ativo
                      ? 'bg-brand-50 text-brand-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {ativo ? (
                      <Check className="h-4 w-4 text-brand-600 shrink-0" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />
                    )}
                    <span className="truncate">{c.nome}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500">
                    {c.dados?.pessoas?.length || 0} cargos
                  </span>
                </div>
              )
            })}
          </div>

          <div className="my-1.5 border-t border-slate-100" />

          {/* Ações */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setAberto(false)
                onAbrirNovoCenario()
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Novo Organograma</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAberto(false)
                onDuplicarCenario(cenarioAtivo.id)
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Copy className="h-4 w-4 text-slate-500" />
              <span>Duplicar este Organograma</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAberto(false)
                onAbrirRenomearCenario(cenarioAtivo)
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Edit2 className="h-4 w-4 text-slate-500" />
              <span>Renomear Organograma</span>
            </button>

            {cenarios.length > 1 && !confirmandoExclusao && (
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(true)}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir este Organograma</span>
              </button>
            )}

            {cenarios.length > 1 && confirmandoExclusao && (
              <div className="mt-1 rounded-xl bg-red-50 px-2.5 py-2">
                <p className="text-[11px] font-medium text-red-700">
                  Excluir “{cenarioAtivo.nome}” ({cenarioAtivo.dados?.pessoas?.length || 0} cargos)?
                  Uma cópia fica recuperável na faixa do topo.
                </p>
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusao(false)}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmandoExclusao(false)
                      setAberto(false)
                      onExcluirCenario(cenarioAtivo.id)
                    }}
                    className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
