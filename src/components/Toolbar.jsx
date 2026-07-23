import { useState } from 'react'
import {
  Check,
  Contact,
  Eye,
  EyeOff,
  Filter,
  Maximize2,
  Menu,
  Network,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Table,
  Tag,
  VenetianMask,
  X,
} from 'lucide-react'
import { SEM_EMPRESA } from '../lib/modelo.js'
import MultiSelect from './MultiSelect.jsx'
import CenarioSelector from './CenarioSelector.jsx'

// Filtro da toolbar: MultiSelect compacto com ícone e prefixo
function FiltroMultiSelect({ rotulo, valoresSelecionados, opcoes, onChange, rotuloTodos, formatar, corDe }) {
  return (
    <MultiSelect
      opcoes={opcoes}
      valoresSelecionados={valoresSelecionados}
      onChange={onChange}
      formatar={formatar}
      corDe={corDe}
      titulo={`Filtrar ${rotulo.toLowerCase()}`}
      rotuloVazio={rotuloTodos}
      prefixo={rotulo}
      icone={<SlidersHorizontal size={16} />}
    />
  )
}

// Uma métrica compacta do bloco de headcount
function Metrica({ rotulo, valor, titulo }) {
  return (
    <div className="flex items-baseline gap-1" title={titulo}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{rotulo}</span>
      <span className="text-xs font-semibold text-slate-700">{valor}</span>
    </div>
  )
}

export default function Toolbar({
  dados,
  onEmpresa,
  onNovaPessoa,
  filtroNiveis,
  maiorNivel,
  onFiltroNiveis,
  filtroArea,
  opcoesArea,
  onFiltroArea,
  filtroSetor,
  opcoesSetor,
  onFiltroSetor,
  empresas = [],
  filtroEmpresas = [],
  onFiltroEmpresas,
  filtroGestores = [],
  opcoesGestor = [],
  onFiltroGestores,
  rotuloPessoa = (id) => id,
  mostrarEtiquetasEmpresa,
  onToggleEtiquetas,
  filtrosAtivos = 0,
  onLimparFiltros,
  pessoasVisiveis = [],
  pessoaIsolada = null,
  onLimparPessoaIsolada,
  cenarios = [],
  cenarioAtivo,
  cenarioAtivoId,
  onSelecionarCenario,
  onAbrirNovoCenario,
  onAbrirRenomearCenario,
  onDuplicarCenario,
  onExcluirCenario,
  modoVisao = 'canvas',
  onChangeModoVisao = () => {},
  onAbrirPaleta,
  onToggleFoco,
  modoConfidencial = false,
  onToggleConfidencial,
  onAbrirMenu,
}) {
  const [editandoEmpresa, setEditandoEmpresa] = useState(false)
  const [nomeEmpresa, setNomeEmpresa] = useState(dados.empresa)

  const totalCargos = dados.pessoas.length
  const totalVagas = dados.pessoas.filter((p) => p.vagaAberta).length
  const totalPessoasAtivas = totalCargos - totalVagas
  const totalGestores = dados.pessoas.filter((p) => p.ehGestor).length

  const visiveisCargos = pessoasVisiveis.length
  const visiveisVagas = pessoasVisiveis.filter((p) => p.vagaAberta).length
  const visiveisPessoasAtivas = visiveisCargos - visiveisVagas
  const visiveisGestores = pessoasVisiveis.filter((p) => p.ehGestor).length

  const temFiltro = filtrosAtivos > 0
  const mostra = (visivel, total) => (temFiltro ? `${visivel}/${total}` : total)

  const modos = [
    { id: 'canvas', rotulo: 'Organograma', icone: Network, titulo: 'Visão Organograma (Canvas de Árvore)' },
    { id: 'tabela', rotulo: 'Tabela', icone: Table, titulo: 'Visão Tabela (Diretório pesquisável e Excel)' },
    { id: 'cartoes', rotulo: 'Cartões', icone: Contact, titulo: 'Visão Cartões (Agrupado por Departamento)' },
  ]

  const cartao = 'rounded-2xl border border-slate-200/80 bg-white/80 shadow-lg backdrop-blur-md'

  return (
    <header className="shrink-0 space-y-2 px-3 pt-3">
      {/* Dock flutuante — identidade, visão e ações.
          z-20 acima da faixa de filtros: senão o backdrop-blur dela (que cria um
          stacking context) cobriria o dropdown de cenários que abre para baixo. */}
      <div className={`${cartao} relative z-20 flex items-center gap-3 px-3 py-2`}>
        {/* Zona esquerda — identidade e contexto */}
        <div className="flex shrink-0 items-center gap-2 text-brand-900">
          <Network size={22} />
          <span className="text-base font-extrabold tracking-tight">Orga</span>
          <span className="ml-0.5 mb-0.5 hidden select-none self-end whitespace-nowrap text-[10px] font-medium text-slate-400 lg:inline">
            por{' '}
            <a
              href="https://guitstech.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-500 transition-colors hover:text-brand-600"
            >
              Guitstech
            </a>
          </span>
        </div>

        <span className="mx-0.5 h-6 w-px shrink-0 bg-slate-200" aria-hidden />

        <CenarioSelector
          cenarios={cenarios}
          cenarioAtivo={cenarioAtivo}
          onSelecionarCenario={onSelecionarCenario}
          onAbrirNovoCenario={onAbrirNovoCenario}
          onAbrirRenomearCenario={onAbrirRenomearCenario}
          onDuplicarCenario={onDuplicarCenario}
          onExcluirCenario={onExcluirCenario}
        />

        {editandoEmpresa ? (
          <div data-tour="grupo" className="flex items-center gap-1">
            <input
              autoFocus
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onEmpresa(nomeEmpresa)
                  setEditandoEmpresa(false)
                } else if (e.key === 'Escape') {
                  setEditandoEmpresa(false)
                }
              }}
              onBlur={() => {
                onEmpresa(nomeEmpresa)
                setEditandoEmpresa(false)
              }}
              className="w-40 rounded-lg border border-slate-300 px-2 py-0.5 text-sm font-semibold text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Nome do grupo"
              placeholder="Nome do grupo"
            />
            <button
              onClick={() => {
                onEmpresa(nomeEmpresa)
                setEditandoEmpresa(false)
              }}
              className="cursor-pointer rounded-lg p-1 text-emerald-600 hover:bg-emerald-50"
              title="Salvar"
            >
              <Check size={16} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setEditandoEmpresa(false)}
              className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            data-tour="grupo"
            className="group flex min-w-0 items-center gap-1"
          >
            <span className="truncate px-1 text-sm font-semibold text-slate-800">
              {dados.empresa || 'Nome do grupo'}
            </span>
            <button
              onClick={() => {
                setNomeEmpresa(dados.empresa)
                setEditandoEmpresa(true)
              }}
              className="cursor-pointer rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
              title="Editar nome do grupo"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}

        {/* Zona central — modos de visão */}
        <div className="mx-auto flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 shadow-inner">
          {modos.map((m) => {
            const Icone = m.icone
            const ativo = modoVisao === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeModoVisao(m.id)}
                title={m.titulo}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  ativo ? 'bg-white text-brand-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icone className="h-3.5 w-3.5 text-brand-600" />
                <span className="hidden sm:inline">{m.rotulo}</span>
              </button>
            )
          })}
        </div>

        {/* Zona direita — ações */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            data-tour="adicionar"
            onClick={onNovaPessoa}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Adicionar</span>
          </button>

          <button
            onClick={onAbrirPaleta}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/60 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Buscar pessoas e comandos"
          >
            <Search size={15} />
            <span className="hidden lg:inline">Buscar</span>
            <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1 text-[10px] font-semibold text-slate-400 lg:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            onClick={onToggleFoco}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Modo foco / apresentação (tecla F)"
            aria-label="Entrar no modo foco"
          >
            <Maximize2 size={18} />
          </button>

          <button
            onClick={onToggleConfidencial}
            className={`rounded-lg p-2 transition-colors ${
              modoConfidencial
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title={
              modoConfidencial
                ? 'Modo confidencial ativo: nomes ocultos — clique para mostrar'
                : 'Modo confidencial: oculta os nomes para reuniões com terceiros'
            }
            aria-label={modoConfidencial ? 'Mostrar nomes reais' : 'Ativar modo confidencial'}
          >
            <VenetianMask size={18} />
          </button>

          <button
            data-tour="menu"
            onClick={onAbrirMenu}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Menu: empresas, backup, layout e ajuda"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Faixa de filtros e opções de visualização */}
      <div
        data-tour="filtros"
        className={`${cartao} relative z-10 flex flex-wrap items-center gap-2 px-3 py-2`}
      >
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          <Filter size={13} /> Filtros
        </span>

        {empresas.length > 0 && (
          <FiltroMultiSelect
            rotulo="Empresa"
            valoresSelecionados={filtroEmpresas}
            opcoes={[...empresas.map((e) => e.id), SEM_EMPRESA]}
            onChange={onFiltroEmpresas}
            rotuloTodos="Todas"
            formatar={(id) =>
              id === SEM_EMPRESA ? 'Sem empresa' : empresas.find((e) => e.id === id)?.nome ?? id
            }
            corDe={(id) => empresas.find((e) => e.id === id)?.cor}
          />
        )}

        {opcoesGestor.length > 0 && (
          <FiltroMultiSelect
            rotulo="Gestor"
            valoresSelecionados={filtroGestores}
            opcoes={opcoesGestor}
            onChange={onFiltroGestores}
            rotuloTodos="Todos"
            formatar={rotuloPessoa}
          />
        )}

        {opcoesArea.length > 0 && (
          <FiltroMultiSelect
            rotulo="Área"
            valoresSelecionados={filtroArea}
            opcoes={opcoesArea}
            onChange={onFiltroArea}
            rotuloTodos="Todas"
          />
        )}

        {opcoesSetor.length > 0 && (
          <FiltroMultiSelect
            rotulo="Setor"
            valoresSelecionados={filtroSetor}
            opcoes={opcoesSetor}
            onChange={onFiltroSetor}
            rotuloTodos="Todos"
          />
        )}

        {maiorNivel > 1 && (
          <FiltroMultiSelect
            rotulo="Nível"
            valoresSelecionados={filtroNiveis}
            opcoes={Array.from({ length: maiorNivel }, (_, i) => i + 1)}
            onChange={onFiltroNiveis}
            rotuloTodos="Todos"
          />
        )}

        {pessoaIsolada && (
          <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            Foco: {rotuloPessoa(pessoaIsolada)}
            <button
              onClick={onLimparPessoaIsolada}
              className="ml-1 cursor-pointer rounded-full p-0.5 text-amber-600 hover:bg-amber-100 hover:text-amber-800"
              title="Limpar foco"
            >
              <X size={12} />
            </button>
          </span>
        )}

        {filtrosAtivos > 0 && (
          <button
            onClick={onLimparFiltros}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
            title="Remove todos os filtros aplicados"
          >
            <X size={14} /> Limpar ({filtrosAtivos})
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Headcount */}
          {totalCargos > 0 && (
            <div className="hidden items-center gap-2 border-r border-slate-200 pr-3 md:flex lg:gap-3">
              <Metrica
                rotulo="Cargos"
                valor={mostra(visiveisCargos, totalCargos)}
                titulo={`${visiveisCargos} cargos visíveis de um total de ${totalCargos}`}
              />
              <Metrica
                rotulo="Pessoas"
                valor={mostra(visiveisPessoasAtivas, totalPessoasAtivas)}
                titulo={`${visiveisPessoasAtivas} pessoas ocupadas de um total de ${totalPessoasAtivas}`}
              />
              <Metrica
                rotulo="Gestores"
                valor={mostra(visiveisGestores, totalGestores)}
                titulo={`${visiveisGestores} gestores visíveis de um total de ${totalGestores}`}
              />
              <Metrica
                rotulo="Vagas"
                valor={mostra(visiveisVagas, totalVagas)}
                titulo={`${visiveisVagas} vagas em aberto de um total de ${totalVagas}`}
              />
            </div>
          )}

          {empresas.length > 0 && (
            <button
              onClick={onToggleEtiquetas}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                mostrarEtiquetasEmpresa
                  ? 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title={
                mostrarEtiquetasEmpresa
                  ? 'Etiquetas de empresa visíveis nos cards — clique para ocultar'
                  : 'Etiquetas de empresa ocultas — clique para mostrar'
              }
            >
              {mostrarEtiquetasEmpresa ? <Eye size={16} /> : <EyeOff size={16} />}
              <Tag size={13} />
              <span className="hidden lg:inline">Etiquetas de Empresa</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
