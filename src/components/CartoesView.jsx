import { useMemo, useState } from 'react'
import {
  Search,
  Building2,
  Crown,
  UserX,
  Pencil,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { corDoNivel } from './PessoaNode.jsx'

export default function CartoesView({
  pessoas = [],
  todasPessoas = [],
  empresas = [],
  onSelecionar,
  onExcluir,
  onAddSubordinado,
}) {
  const [busca, setBusca] = useState('')
  const [secoesAbertas, setSecoesAbertas] = useState({})
  const [confirmandoId, setConfirmandoId] = useState(null) // exclusão embutida

  const empresasPorId = useMemo(
    () => new Map(empresas.map((e) => [e.id, e])),
    [empresas]
  )

  const gestoresPorId = useMemo(
    () => new Map(todasPessoas.map((p) => [p.id, p])),
    [todasPessoas]
  )

  // Agrupamento por Área / Departamento
  const gruposPorArea = useMemo(() => {
    let lista = [...pessoas]

    if (busca.trim()) {
      const termo = busca.toLowerCase().trim()
      lista = lista.filter((p) => {
        const nome = (p.nome || '').toLowerCase()
        const cargo = (p.cargo || '').toLowerCase()
        const area = (p.area || '').toLowerCase()
        const setor = (p.setor || '').toLowerCase()
        return (
          nome.includes(termo) ||
          cargo.includes(termo) ||
          area.includes(termo) ||
          setor.includes(termo)
        )
      })
    }

    const mapa = new Map()
    for (const p of lista) {
      const chaveArea = (p.area || 'Geral / Sem Área').trim()
      if (!mapa.has(chaveArea)) {
        mapa.set(chaveArea, [])
      }
      mapa.get(chaveArea).push(p)
    }

    // Ordenar pessoas dentro de cada grupo por nível hierárquico
    for (const [area, membros] of mapa.entries()) {
      membros.sort((a, b) => a.nivel - b.nivel || (a.nome || a.cargo).localeCompare(b.nome || b.cargo, 'pt-BR'))
    }

    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
  }, [pessoas, busca])

  const toggleSecao = (area) => {
    setSecoesAbertas((prev) => ({
      ...prev,
      [area]: !prev[area],
    }))
  }

  return (
    <div className="flex h-full flex-col bg-white p-4 md:p-6 overflow-hidden">
      {/* Barra de Busca Topo */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar departamento, cargo ou nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <span className="text-xs font-medium text-slate-500">
          Exibindo <strong className="text-slate-800">{gruposPorArea.length}</strong> áreas (
          <strong className="text-slate-800">{pessoas.length}</strong> cargos)
        </span>
      </div>

      {/* Seções por Área */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {gruposPorArea.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
            Nenhum departamento ou colaborador encontrado para a busca.
          </div>
        ) : (
          gruposPorArea.map(([nomeArea, membros]) => {
            const fechado = secoesAbertas[nomeArea] === true
            const liderDaArea = membros.find((m) => m.ehGestor || m.nivel === 1) || membros[0]

            return (
              <div
                key={nomeArea}
                className="rounded-2xl border border-slate-200 bg-white shadow-2xs transition-all overflow-hidden"
              >
                {/* Cabeçalho do Departamento */}
                <div
                  onClick={() => toggleSecao(nomeArea)}
                  className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-brand-600" />
                    <h3 className="font-bold text-slate-800 text-sm">{nomeArea}</h3>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                      {membros.length} cargos
                    </span>
                  </div>

                  <button className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                    {fechado ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>

                {/* Grade de Cartões */}
                {!fechado && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {membros.map((p) => {
                      const corNivel = corDoNivel(p.nivel)
                      const gestor = p.gestorId ? gestoresPorId.get(p.gestorId) : null
                      const ehLiderArea = p.id === liderDaArea?.id

                      return (
                        <div
                          key={p.id}
                          className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all group ${
                            ehLiderArea
                              ? 'border-brand-200 bg-brand-50/20 shadow-xs ring-1 ring-brand-500/10'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                          }`}
                        >
                          {/* Faixa superior / Nível */}
                          <div className="flex items-center justify-between mb-2.5">
                            <span
                              className="inline-flex items-center justify-center rounded-md px-2 py-0.5 font-extrabold text-[10px] text-white shadow-2xs"
                              style={{ backgroundColor: corNivel }}
                            >
                              Nível {p.nivel}
                            </span>

                            {ehLiderArea && (
                              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Crown className="h-3 w-3 text-amber-600" /> Líder
                              </span>
                            )}
                          </div>

                          {/* Info Principal */}
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white text-sm shrink-0 shadow-xs"
                              style={{ backgroundColor: corNivel }}
                            >
                              {p.vagaAberta ? 'V' : (p.nome ? p.nome.charAt(0).toUpperCase() : '?')}
                            </div>

                            <div className="overflow-hidden">
                              <h4 className="font-bold text-slate-800 text-xs truncate">
                                {p.vagaAberta ? (
                                  <span className="text-amber-600 font-semibold italic flex items-center gap-1">
                                    <UserX className="h-3.5 w-3.5" /> Vaga Aberta
                                  </span>
                                ) : (
                                  p.nome || 'Sem Nome'
                                )}
                              </h4>
                              <p className="text-xs font-semibold text-slate-600 truncate">{p.cargo}</p>
                              {p.setor && <p className="text-[10px] text-slate-400 truncate">{p.setor}</p>}
                            </div>
                          </div>

                          {/* Gestor Direto */}
                          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5 mb-3">
                            <span className="text-slate-400">Reporta a: </span>
                            <span className="font-semibold text-slate-700">
                              {gestor ? gestor.nome || gestor.cargo : 'Topo (Sem Gestor)'}
                            </span>
                          </div>

                          {/* Ações */}
                          {confirmandoId === p.id ? (
                            (() => {
                              const nSub = todasPessoas.filter((s) => s.gestorId === p.id).length
                              return (
                                <div className="border-t border-slate-100 pt-2.5 mt-auto">
                                  <p className="text-[10px] font-medium text-red-600 mb-1.5">
                                    Excluir este cargo?
                                    {nSub ? ` ${nSub} subordinado(s) serão reatados ao gestor acima.` : ''}
                                  </p>
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setConfirmandoId(null)}
                                      className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => {
                                        onExcluir(p.id)
                                        setConfirmandoId(null)
                                      }}
                                      className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              )
                            })()
                          ) : (
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-auto">
                              <div className="flex flex-wrap gap-1 max-w-[60%]">
                                {(() => {
                                  const empresaIdsSet = new Set(p.empresaIds || [])
                                  const empresasDaPessoa = empresas.filter((e) => empresaIdsSet.has(e.id))
                                  return empresasDaPessoa.map((emp) => (
                                    <span
                                      key={emp.id}
                                      className="h-2 w-2 rounded-full shadow-2xs"
                                      style={{ backgroundColor: emp.cor }}
                                      title={emp.nome}
                                    />
                                  ))
                                })()}
                              </div>

                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => onAddSubordinado(p.id)}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                  title="Adicionar Subordinado"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => onSelecionar(p.id)}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmandoId(p.id)}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
