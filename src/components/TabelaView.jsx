import { useMemo, useState } from 'react'
import {
  Search,
  Download,
  Pencil,
  Trash2,
  UserPlus,
  ArrowUpDown,
  Building2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { corDoNivel } from './PessoaNode.jsx'

export default function TabelaView({
  pessoas = [],
  todasPessoas = [],
  empresas = [],
  onSelecionar,
  onExcluir,
  onAddSubordinado,
  rotuloPessoa = (id) => id,
}) {
  const [busca, setBusca] = useState('')
  const [ordemCampo, setOrdemCampo] = useState('nivel') // 'nome' | 'cargo' | 'nivel' | 'area'
  const [ordemDirecao, setOrdemDirecao] = useState('asc') // 'asc' | 'desc'
  const [confirmandoId, setConfirmandoId] = useState(null) // exclusão embutida

  const empresasPorId = useMemo(
    () => new Map(empresas.map((e) => [e.id, e])),
    [empresas]
  )

  const gestoresPorId = useMemo(
    () => new Map(todasPessoas.map((p) => [p.id, p])),
    [todasPessoas]
  )

  // Filtragem local de busca
  const pessoasFiltradas = useMemo(() => {
    let lista = [...pessoas]
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim()
      lista = lista.filter((p) => {
        const nome = (p.nome || '').toLowerCase()
        const cargo = (p.cargo || '').toLowerCase()
        const area = (p.area || '').toLowerCase()
        const setor = (p.setor || '').toLowerCase()
        const gestor = p.gestorId ? (gestoresPorId.get(p.gestorId)?.nome || '').toLowerCase() : ''
        return (
          nome.includes(termo) ||
          cargo.includes(termo) ||
          area.includes(termo) ||
          setor.includes(termo) ||
          gestor.includes(termo)
        )
      })
    }

    // Ordenação
    lista.sort((a, b) => {
      let valA = a[ordemCampo] ?? ''
      let valB = b[ordemCampo] ?? ''

      if (ordemCampo === 'nome') {
        valA = a.vagaAberta ? `Vaga: ${a.cargo}` : a.nome || ''
        valB = b.vagaAberta ? `Vaga: ${b.cargo}` : b.nome || ''
      }

      let res = 0
      if (typeof valA === 'number' && typeof valB === 'number') {
        res = valA - valB
      } else {
        res = String(valA).localeCompare(String(valB), 'pt-BR')
      }

      return ordemDirecao === 'asc' ? res : -res
    })

    return lista
  }, [pessoas, busca, ordemCampo, ordemDirecao, gestoresPorId])

  const alternarOrdem = (campo) => {
    if (ordemCampo === campo) {
      setOrdemDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrdemCampo(campo)
      setOrdemDirecao('asc')
    }
  }

  // Exportar para CSV
  const exportarCSV = () => {
    // Campo CSV: envolve em aspas e escapa aspas internas dobrando-as, senão
    // um nome como João "Jota" Silva quebraria a linha na planilha.
    const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const cabecalho = ['Nome', 'Cargo', 'Nível', 'Status', 'Área', 'Setor', 'Gestor Direto', 'Empresas']
    const linhas = pessoasFiltradas.map((p) => {
      const gestor = p.gestorId ? gestoresPorId.get(p.gestorId) : null
      const gestorNome = gestor ? gestor.nome || gestor.cargo : 'Topo (Sem Gestor)'
      const nomesEmpresas = (p.empresaIds || [])
        .map((id) => empresasPorId.get(id)?.nome)
        .filter(Boolean)
        .join('; ')

      return [
        csv(p.vagaAberta ? 'Vaga em Aberto' : p.nome || ''),
        csv(p.cargo || ''),
        p.nivel,
        csv(p.vagaAberta ? 'Vaga Aberta' : 'Ocupado'),
        csv(p.area || ''),
        csv(p.setor || ''),
        csv(gestorNome),
        csv(nomesEmpresas),
      ].join(',')
    })

    const conteudoCSV = '\uFEFF' + [cabecalho.join(','), ...linhas].join('\n')
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organograma_pessoas_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col bg-white p-4 md:p-6 overflow-hidden">
      {/* Barra de Filtros da Tabela */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, cargo, área ou gestor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            Exibindo <strong className="text-slate-800">{pessoasFiltradas.length}</strong> de{' '}
            <strong className="text-slate-800">{pessoas.length}</strong> cargos
          </span>

          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
            title="Exportar dados filtrados para planilha CSV"
          >
            <Download className="h-4 w-4 text-brand-600" />
            <span>Exportar Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Tabela de Pessoas.
          overflow-hidden fica no wrapper arredondado; quem rola de verdade é o
          div interno (sem raio de borda) — senão a barra de rolagem nativa,
          que é sempre reta, corta o canto arredondado e fica com aparência
          torta bem no canto onde ela aparece. */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
        <div className="h-full overflow-auto">
        <table className="w-full border-collapse text-left text-xs text-slate-700">
          <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-xs text-[11px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th
                onClick={() => alternarOrdem('nome')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Nome / Colaborador</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => alternarOrdem('cargo')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Cargo</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => alternarOrdem('nivel')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Nível</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => alternarOrdem('area')}
                className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Área / Setor</span>
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3">Gestor Direto</th>
              <th className="px-4 py-3">Empresas</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {pessoasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Nenhum cargo encontrado para a busca especificada.
                </td>
              </tr>
            ) : (
              pessoasFiltradas.map((p) => {
                const gestor = p.gestorId ? gestoresPorId.get(p.gestorId) : null
                const corNivel = corDoNivel(p.nivel)

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: corNivel }}
                        >
                          {p.vagaAberta ? 'V' : (p.nome ? p.nome.charAt(0).toUpperCase() : '?')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {p.vagaAberta ? (
                              <span className="text-amber-600 font-semibold italic flex items-center gap-1">
                                <UserX className="h-3.5 w-3.5" /> Vaga em Aberto
                              </span>
                            ) : (
                              p.nome || 'Sem Nome'
                            )}
                          </div>
                          {p.ehGestor && (
                            <span className="inline-block rounded-full bg-brand-100 px-1.5 py-0.2 text-[9px] font-extrabold text-brand-800">
                              Gestor
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cargo */}
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {p.cargo}
                    </td>

                    {/* Nível */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex items-center justify-center h-6 w-6 rounded-full font-extrabold text-xs text-white shadow-2xs"
                        style={{ backgroundColor: corNivel }}
                      >
                        {p.nivel}
                      </span>
                    </td>

                    {/* Área / Setor */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.area || '—'}</div>
                      {p.setor && <div className="text-[11px] text-slate-400">{p.setor}</div>}
                    </td>

                    {/* Gestor Direto */}
                    <td className="px-4 py-3 text-slate-600">
                      {gestor ? (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-800">
                            {gestor.nome || gestor.cargo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Topo / Sem Gestor
                        </span>
                      )}
                    </td>

                    {/* Empresas */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const empresaIdsSet = new Set(p.empresaIds || [])
                          const empresasDaPessoa = empresas.filter((e) => empresaIdsSet.has(e.id))
                          if (empresasDaPessoa.length === 0) {
                            return <span className="text-slate-400 text-[11px]">—</span>
                          }
                          return empresasDaPessoa.map((emp) => (
                            <span
                              key={emp.id}
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-2xs"
                              style={{ backgroundColor: emp.cor }}
                            >
                              {emp.nome}
                            </span>
                          ))
                        })()}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right">
                      {confirmandoId === p.id ? (
                        (() => {
                          const nSub = todasPessoas.filter((s) => s.gestorId === p.id).length
                          return (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] font-medium text-red-600">
                                Excluir?{nSub ? ` ${nSub} subord. serão reatados` : ''}
                              </span>
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
                          )
                        })()
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onAddSubordinado(p.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            title="Adicionar Subordinado a este cargo"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onSelecionar(p.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                            title="Editar cargo"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmandoId(p.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Excluir cargo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
