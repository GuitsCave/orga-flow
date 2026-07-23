import { useState } from 'react'
import { Copy, Plus, X, Layers, CheckSquare, Square } from 'lucide-react'
import { comDescendentes } from '../lib/modelo.js'

export default function ModalCenario({
  onFechar,
  cenarios = [],
  cenarioAtivo,
  onCriarCenario,
  modoInicial = 'novo', // 'novo' | 'renomear'
  cenarioParaRenomear = null,
  onRenomearCenario,
}) {
  const [modo, setModo] = useState(modoInicial)
  const [nome, setNome] = useState(
    modo === 'renomear' && cenarioParaRenomear ? cenarioParaRenomear.nome : ''
  )
  const [tipoCriacao, setTipoCriacao] = useState('modelo') // 'zero' | 'modelo' | 'equipes'
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState(cenarioAtivo?.id || cenarios[0]?.id || '')
  
  // Lista de pessoas do modelo escolhido para seleção de equipes
  const modeloAtual = cenarios.find((c) => c.id === modeloSelecionadoId) || cenarioAtivo
  const pessoasModelo = modeloAtual?.dados?.pessoas || []
  const gestoresModelo = pessoasModelo.filter((p) => p.ehGestor)

  const [gestoresSelecionados, setGestoresSelecionados] = useState(new Set())

  const toggleGestor = (id) => {
    setGestoresSelecionados((prev) => {
      const proximo = new Set(prev)
      if (proximo.has(id)) {
        proximo.delete(id)
      } else {
        proximo.add(id)
      }
      return proximo
    })
  }

  const toggleTodosGestores = () => {
    if (gestoresSelecionados.size === gestoresModelo.length) {
      setGestoresSelecionados(new Set())
    } else {
      setGestoresSelecionados(new Set(gestoresModelo.map((g) => g.id)))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modo === 'renomear' && cenarioParaRenomear) {
      if (nome.trim()) {
        onRenomearCenario(cenarioParaRenomear.id, nome.trim())
        onFechar()
      }
      return
    }

    // Modo Criar
    const nomeFinal = nome.trim() || 'Novo Organograma'

    if (tipoCriacao === 'zero') {
      onCriarCenario({ nome: nomeFinal, modeloId: null })
    } else if (tipoCriacao === 'modelo') {
      onCriarCenario({ nome: nomeFinal, modeloId: modeloSelecionadoId })
    } else if (tipoCriacao === 'equipes') {
      // Calcular todas as pessoas dos gestores selecionados + seus descendentes
      const idsPessoas = Array.from(
        comDescendentes(Array.from(gestoresSelecionados), pessoasModelo)
      )
      onCriarCenario({
        nome: nomeFinal,
        modeloId: modeloSelecionadoId,
        incluirPessoasIds: idsPessoas,
      })
    }

    onFechar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-brand-900">
            <Layers className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {modo === 'renomear' ? 'Renomear Organograma' : 'Novo Organograma / Cenário'}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Nome do Organograma
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Reestruturação Q4, Projeto Vendas, etc."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {modo === 'novo' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Como deseja criar este organograma?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoCriacao('modelo')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                      tipoCriacao === 'modelo'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Copy className="h-5 w-5 text-brand-600" />
                    <span className="text-xs">Copiar Completo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoCriacao('equipes')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                      tipoCriacao === 'equipes'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckSquare className="h-5 w-5 text-brand-600" />
                    <span className="text-xs">Copiar Equipes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoCriacao('zero')}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                      tipoCriacao === 'zero'
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="h-5 w-5 text-brand-600" />
                    <span className="text-xs">Criar do Zero</span>
                  </button>
                </div>
              </div>

              {(tipoCriacao === 'modelo' || tipoCriacao === 'equipes') && cenarios.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Organograma de Origem / Modelo
                  </label>
                  <select
                    value={modeloSelecionadoId}
                    onChange={(e) => {
                      setModeloSelecionadoId(e.target.value)
                      setGestoresSelecionados(new Set())
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500"
                  >
                    {cenarios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.dados?.pessoas?.length || 0} cargos)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {tipoCriacao === 'equipes' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Selecione as Equipes / Gestores a copiar:
                    </label>
                    <button
                      type="button"
                      onClick={toggleTodosGestores}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      {gestoresSelecionados.size === gestoresModelo.length
                        ? 'Desmarcar todos'
                        : 'Marcar todos'}
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1 bg-slate-50">
                    {gestoresModelo.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 text-center">
                        Nenhum gestor encontrado no organograma modelo.
                      </p>
                    ) : (
                      gestoresModelo.map((g) => {
                        const marcado = gestoresSelecionados.has(g.id)
                        return (
                          <div
                            key={g.id}
                            onClick={() => toggleGestor(g.id)}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                              marcado ? 'bg-brand-100 text-brand-900 font-semibold' : 'bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {marcado ? (
                              <CheckSquare className="h-4 w-4 text-brand-600 shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">
                              {g.nome || g.cargo} <span className="text-slate-400 text-[11px]">({g.area || 'Geral'})</span>
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}

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
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              {modo === 'renomear' ? 'Salvar Nome' : 'Criar Organograma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
