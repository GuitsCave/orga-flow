import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  UserPlus,
  Building2,
  Layers,
  ArrowRightLeft,
  Network,
  Table2,
  IdCard,
  HelpCircle,
  Maximize2,
  Minimize2,
  Move,
  CornerDownLeft,
  User,
  UserX,
} from 'lucide-react'

/** Ignora acentos e maiúsculas para a busca ("joao" acha "João") */
const normalizar = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Paleta de comandos (Ctrl/Cmd + K): busca pessoas e dispara ações sem mouse.
 * Não guarda nenhum estado próprio de dados — só chama callbacks que já existem
 * no App. Fecha no Esc, no clique fora e depois de executar qualquer item.
 */
export default function CommandPalette({
  onFechar,
  pessoas = [],
  cenarios = [],
  cenarioAtivoId,
  modoVisao,
  layoutManual,
  modoFoco,
  onIrParaPessoa,
  onNovaPessoa,
  onAbrirEmpresas,
  onAbrirNovoCenario,
  onSelecionarCenario,
  onChangeModoVisao,
  onToggleManual,
  onToggleFoco,
  onAbrirTour,
}) {
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState(0)
  const inputRef = useRef(null)
  const listaRef = useRef(null)

  // Ações fixas disponíveis na paleta. Cada `run` roda o callback e fecha.
  const acoes = useMemo(() => {
    const lista = [
      {
        chave: 'add',
        rotulo: 'Adicionar pessoa',
        dica: 'Novo cargo no organograma',
        icone: UserPlus,
        run: onNovaPessoa,
      },
      modoVisao !== 'canvas' && {
        chave: 'view-canvas',
        rotulo: 'Ver como Organograma',
        dica: 'Visão em árvore',
        icone: Network,
        run: () => onChangeModoVisao('canvas'),
      },
      modoVisao !== 'tabela' && {
        chave: 'view-tabela',
        rotulo: 'Ver como Tabela',
        dica: 'Lista ordenável',
        icone: Table2,
        run: () => onChangeModoVisao('tabela'),
      },
      modoVisao !== 'cartoes' && {
        chave: 'view-cartoes',
        rotulo: 'Ver como Cartões',
        dica: 'Agrupado por área',
        icone: IdCard,
        run: () => onChangeModoVisao('cartoes'),
      },
      {
        chave: 'foco',
        rotulo: modoFoco ? 'Sair do modo foco' : 'Entrar no modo foco',
        dica: 'Apresentação — só o canvas (tecla F)',
        icone: modoFoco ? Minimize2 : Maximize2,
        run: onToggleFoco,
      },
      {
        chave: 'empresas',
        rotulo: 'Cadastrar empresas',
        dica: 'Registro de empresas do grupo',
        icone: Building2,
        run: onAbrirEmpresas,
      },
      {
        chave: 'novo-cenario',
        rotulo: 'Novo organograma / cenário',
        dica: 'Criar do zero ou a partir de um modelo',
        icone: Layers,
        run: onAbrirNovoCenario,
      },
      {
        chave: 'layout',
        rotulo: layoutManual ? 'Voltar ao layout automático' : 'Ativar layout manual',
        dica: 'Alterna posicionamento dos blocos',
        icone: Move,
        run: onToggleManual,
      },
      {
        chave: 'tour',
        rotulo: 'Abrir o passo a passo',
        dica: 'Tour guiado da interface',
        icone: HelpCircle,
        run: onAbrirTour,
      },
    ].filter(Boolean)

    // Trocar para cada um dos outros cenários
    for (const c of cenarios) {
      if (c.id === cenarioAtivoId) continue
      lista.push({
        chave: `cenario-${c.id}`,
        rotulo: `Ir para: ${c.nome}`,
        dica: `${c.dados?.pessoas?.length || 0} cargos`,
        icone: ArrowRightLeft,
        run: () => onSelecionarCenario(c.id),
      })
    }
    return lista
  }, [
    cenarios,
    cenarioAtivoId,
    modoVisao,
    layoutManual,
    modoFoco,
    onNovaPessoa,
    onChangeModoVisao,
    onAbrirEmpresas,
    onAbrirNovoCenario,
    onToggleManual,
    onToggleFoco,
    onAbrirTour,
    onSelecionarCenario,
  ])

  const termo = normalizar(busca)

  const acoesFiltradas = useMemo(
    () =>
      !termo
        ? acoes
        : acoes.filter((a) => normalizar(`${a.rotulo} ${a.dica}`).includes(termo)),
    [acoes, termo],
  )

  const pessoasFiltradas = useMemo(() => {
    const rotuloDe = (p) => p.nome || `Vaga: ${p.cargo}`
    const base = !termo
      ? pessoas
      : pessoas.filter((p) =>
          normalizar(`${rotuloDe(p)} ${p.cargo} ${p.area} ${p.setor}`).includes(termo),
        )
    // Do topo para baixo; limita para a lista não explodir em orgs grandes
    return [...base]
      .sort((a, b) => a.nivel - b.nivel || rotuloDe(a).localeCompare(rotuloDe(b), 'pt-BR'))
      .slice(0, 50)
  }, [pessoas, termo])

  // Lista achatada na ordem de exibição — é sobre ela que setas e Enter operam
  const itens = useMemo(() => {
    const dePessoas = pessoasFiltradas.map((p) => ({
      chave: `pessoa-${p.id}`,
      tipo: 'pessoa',
      pessoa: p,
      run: () => onIrParaPessoa(p.id),
    }))
    const deAcoes = acoesFiltradas.map((a) => ({ ...a, tipo: 'acao' }))
    return [...deAcoes, ...dePessoas]
  }, [acoesFiltradas, pessoasFiltradas, onIrParaPessoa])

  // Volta a seleção para o topo sempre que a busca muda o conjunto
  useEffect(() => {
    setSelecionado(0)
  }, [termo])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Mantém o item selecionado visível ao navegar pelo teclado
  useEffect(() => {
    const el = listaRef.current?.querySelector(`[data-idx="${selecionado}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selecionado])

  const executar = (item) => {
    if (!item) return
    item.run?.()
    onFechar()
  }

  const aoTeclar = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onFechar()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelecionado((i) => Math.min(i + 1, itens.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelecionado((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executar(itens[selecionado])
    }
  }

  const nAcoes = acoesFiltradas.length

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/40 backdrop-blur-xs p-4 pt-[14vh]"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Campo de busca */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={aoTeclar}
            placeholder="Buscar pessoa ou comando..."
            className="w-full bg-transparent py-3.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
            Esc
          </kbd>
        </div>

        {/* Resultados */}
        <div ref={listaRef} className="max-h-80 overflow-y-auto p-2">
          {itens.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">
              Nenhum resultado para “{busca}”.
            </p>
          ) : (
            <>
              {acoesFiltradas.length > 0 && (
                <div className="px-2 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Ações
                </div>
              )}
              {acoesFiltradas.map((a, i) => {
                const Icone = a.icone
                const ativo = i === selecionado
                return (
                  <button
                    key={a.chave}
                    data-idx={i}
                    onMouseEnter={() => setSelecionado(i)}
                    onClick={() => executar(itens[i])}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                      ativo ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Icone className={`h-4 w-4 shrink-0 ${ativo ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span className={`flex-1 truncate text-sm font-semibold ${ativo ? 'text-brand-900' : 'text-slate-700'}`}>
                      {a.rotulo}
                    </span>
                    <span className="hidden truncate text-xs text-slate-400 sm:block">{a.dica}</span>
                    {ativo && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                  </button>
                )
              })}

              {pessoasFiltradas.length > 0 && (
                <div className="px-2 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Pessoas
                </div>
              )}
              {pessoasFiltradas.map((p, j) => {
                const i = nAcoes + j
                const ativo = i === selecionado
                return (
                  <button
                    key={p.id}
                    data-idx={i}
                    onMouseEnter={() => setSelecionado(i)}
                    onClick={() => executar(itens[i])}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                      ativo ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {p.vagaAberta ? (
                      <UserX className={`h-4 w-4 shrink-0 ${ativo ? 'text-amber-600' : 'text-amber-500'}`} />
                    ) : (
                      <User className={`h-4 w-4 shrink-0 ${ativo ? 'text-brand-600' : 'text-slate-400'}`} />
                    )}
                    <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${ativo ? 'text-brand-900' : 'text-slate-700'}`}>
                      {p.vagaAberta ? `Vaga: ${p.cargo}` : p.nome}
                    </span>
                    <span className="hidden max-w-[45%] truncate text-xs text-slate-400 sm:block">
                      {[p.cargo, p.area].filter(Boolean).join(' · ')}
                    </span>
                    {ativo && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand-400" />}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* Rodapé com dicas de teclado */}
        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-semibold">↑</kbd>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-semibold">↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-semibold">↵</kbd>
            selecionar
          </span>
        </div>
      </div>
    </div>
  )
}
