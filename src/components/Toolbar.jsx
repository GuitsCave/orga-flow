import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  Check,
  Contact,
  Eye,
  EyeOff,
  Filter,
  Maximize2,
  Network,
  Pencil,
  Plus,
  Search,
  Table,
  Tag,
  VenetianMask,
  X,
} from 'lucide-react'
import { SEM_EMPRESA } from '../lib/modelo.js'
import MultiSelect from './MultiSelect.jsx'
import CenarioSelector from './CenarioSelector.jsx'

// Hambúrguer com um micro-gesto próprio (as linhas se abrem no hover) — o
// ícone genérico do lucide não dá esse gancho por linha individual.
function IconeMenu() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" className="transition-transform duration-200 origin-center group-hover:-translate-y-[1.5px] group-hover:-rotate-[4deg]" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" className="transition-transform duration-200 origin-center group-hover:translate-y-[1.5px] group-hover:rotate-[4deg]" />
    </svg>
  )
}

// Filtro da toolbar: MultiSelect compacto com prefixo. Sem ícone — os 5
// filtros usavam o mesmo ícone genérico, que não diferenciava nada e só
// ocupava espaço (relevante na faixa estreita: 5 filtros + headcount + toggle
// disputando a mesma linha).
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
  const reduzMovimento = useReducedMotion()

  // Entrada em cascata do dock ao carregar a página: cada zona (logo,
  // cenários, nome do grupo, seletor de visão, ações) é um filho direto de
  // um motion.div com staggerChildren, então elas entram uma de cada vez em
  // vez de tudo aparecer junto. A faixa de filtros usa delayChildren maior
  // para entrar depois que o dock já assentou — reforça que o dock manda e
  // os filtros seguem.
  const variantesDock = {
    oculto: {},
    visivel: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
  }
  // A faixa de filtros entra como um bloco só (sem stagger por chip — os
  // filtros são condicionais e variam em quantidade), atrasada o bastante
  // pra assentar só depois que o dock já terminou a própria cascata.
  const variantesFiltros = {
    oculto: { opacity: 0, y: -8, scale: 0.98 },
    visivel: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1], delay: 0.42 },
    },
  }
  const variantesItem = {
    oculto: { opacity: 0, y: -8, scale: 0.96 },
    visivel: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  }
  const hoverBotao = reduzMovimento ? {} : { y: -2 }
  const tapBotao = reduzMovimento ? {} : { scale: 0.95 }

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
    <header className="relative shrink-0 space-y-2 px-3 pt-3">
      {/* Campo "aurora": liga visualmente o dock e a faixa de filtros com as
          próprias cores de nível (1-6) do organograma — não é um acento
          decorativo qualquer, é a paleta que esse cabeçalho comanda. Fica
          atrás dos dois cartões (z-0; os cartões são z-30/z-20) e é
          irmão deles no DOM, não ancestral — por isso o overflow-hidden
          aqui dentro só recorta os próprios blobs, nunca o dropdown do
          CenarioSelector (que vive dentro do cartão do dock).
          Some inteiramente com prefers-reduced-motion. */}
      {!reduzMovimento && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{
            // Sem isso, o overflow-hidden reto corta os blobs numa linha reta
            // exatamente na borda do cabeçalho — bem visível contra o fundo
            // branco da Tabela/Cartões. Não basta esmaecer perto da borda:
            // logo abaixo do cabeçalho o app já troca de cor (cinza da
            // página para branco da Tabela/Cartões), então qualquer resquício
            // de cor bem no fim do cabeçalho criava uma terceira faixa ali —
            // cinza, aurora, branco, todas visíveis em sequência. A máscara
            // concentra a aurora perto do dock (topo) e some por completo
            // bem antes da faixa de filtros terminar, deixando o fim do
            // cabeçalho neutro como sempre foi.
            maskImage: 'radial-gradient(100% 85% at 50% 12%, black 18%, transparent 55%)',
            WebkitMaskImage: 'radial-gradient(100% 85% at 50% 12%, black 18%, transparent 55%)',
          }}
        >
          <span className="absolute -top-16 -left-10 h-64 w-64 rounded-full bg-nivel-2/25 blur-3xl animate-aurora-1" />
          <span className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-nivel-5/20 blur-3xl animate-aurora-2" />
          <span className="absolute top-10 left-1/2 h-44 w-80 -translate-x-1/2 rounded-full bg-nivel-3/20 blur-3xl animate-aurora-3" />
          <motion.span
            className="absolute top-1/2 left-1/2 h-6 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-brand-500/20 to-transparent blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
          />
        </div>
      )}

      {/* Dock flutuante — identidade, visão e ações.
          z-30 acima de tudo abaixo dele: da faixa de filtros (senão o
          backdrop-blur dela, que cria um stacking context, cobriria o
          dropdown de cenários) e do conteúdo principal (o cabeçalho fixo da
          Tabela usa z-10 — sem essa ordem clara, dois z-index iguais em
          galhos diferentes da árvore empatam, e quem vem depois no HTML
          vence; como <main> vem depois do <header>, a Tabela cobriria os
          dropdowns dos filtros mesmo eles tendo z-30 *dentro* do próprio
          cartão).
          variantesDock/variantesItem orquestram a entrada em cascata: cada
          motion.div filho direto é um item que a stagger acende em sequência. */}
      <motion.div
        variants={variantesDock}
        initial={reduzMovimento ? false : 'oculto'}
        animate="visivel"
        className={`${cartao} relative z-30 flex flex-wrap items-center gap-3 px-3 py-2`}
      >
        {/* Zona esquerda — identidade e contexto */}
        <motion.div variants={variantesItem} className="flex shrink-0 items-center gap-2 text-brand-900">
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
        </motion.div>

        <motion.span variants={variantesItem} className="mx-0.5 h-6 w-px shrink-0 bg-slate-200" aria-hidden />

        <motion.div variants={variantesItem}>
          <CenarioSelector
            cenarios={cenarios}
            cenarioAtivo={cenarioAtivo}
            onSelecionarCenario={onSelecionarCenario}
            onAbrirNovoCenario={onAbrirNovoCenario}
            onAbrirRenomearCenario={onAbrirRenomearCenario}
            onDuplicarCenario={onDuplicarCenario}
            onExcluirCenario={onExcluirCenario}
          />
        </motion.div>

        <motion.div variants={variantesItem}>
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
        </motion.div>

        {/* Zona central — modos de visão */}
        <motion.div
          variants={variantesItem}
          data-tour="visao"
          className="mx-auto flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 shadow-inner"
        >
          {modos.map((m) => {
            const Icone = m.icone
            const ativo = modoVisao === m.id
            return (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => onChangeModoVisao(m.id)}
                title={m.titulo}
                whileHover={hoverBotao}
                whileTap={tapBotao}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                  ativo ? 'text-brand-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {/* Pílula com layoutId: só o botão ativo a renderiza, então
                    trocar de aba anima o mesmo elemento deslizando (FLIP) em
                    vez de um aceso/apagado instantâneo. */}
                {ativo && (
                  <motion.span
                    layoutId="pilula-modo-visao"
                    className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Icone className="relative z-10 h-3.5 w-3.5 text-brand-600" />
                <span className="relative z-10 hidden sm:inline">{m.rotulo}</span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Zona direita — ações */}
        <motion.div variants={variantesItem} className="flex shrink-0 items-center gap-1.5">
          <motion.button
            data-tour="adicionar"
            onClick={onNovaPessoa}
            whileHover={hoverBotao}
            whileTap={tapBotao}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Adicionar</span>
          </motion.button>

          <motion.button
            data-tour="buscar"
            onClick={onAbrirPaleta}
            whileHover={hoverBotao}
            whileTap={tapBotao}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/60 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Buscar pessoas e comandos"
          >
            <Search size={15} />
            <span className="hidden lg:inline">Buscar</span>
            <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1 text-[10px] font-semibold text-slate-400 lg:inline">
              Ctrl K
            </kbd>
          </motion.button>

          <motion.button
            onClick={onToggleFoco}
            whileHover={hoverBotao}
            whileTap={tapBotao}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Modo foco / apresentação (tecla F)"
            aria-label="Entrar no modo foco"
          >
            <Maximize2 size={18} />
          </motion.button>

          <motion.button
            data-tour="confidencial"
            onClick={onToggleConfidencial}
            whileHover={hoverBotao}
            whileTap={tapBotao}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
          </motion.button>

          <motion.button
            data-tour="menu"
            onClick={onAbrirMenu}
            whileHover={hoverBotao}
            whileTap={tapBotao}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="group rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Menu: empresas, backup, layout e ajuda"
            aria-label="Abrir menu"
          >
            <IconeMenu />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Faixa de filtros e opções de visualização.
          Duas colunas, não uma linha só: a esquerda (filtros) é a única que
          wrapa internamente quando falta espaço; a direita (headcount +
          etiquetas) fica fixa no topo. Sem isso, o bloco da direita (antes
          empurrado por ml-auto numa única flex-wrap) podia "sobrar" colado a
          um filtro solto na última linha, com um vão feio no meio — e virar
          duas linhas sempre (a alternativa mais simples) desperdiça espaço
          vertical à toa quando os filtros cabem numa linha só. */}
      <motion.div
        data-tour="filtros"
        variants={variantesFiltros}
        initial={reduzMovimento ? false : 'oculto'}
        animate="visivel"
        className={`${cartao} relative z-20 flex flex-wrap items-start gap-3 px-3 py-2`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Headcount: some no espaço junto com o toggle antes de cair pra
              baixo, para o texto não espremer contra os filtros. */}
          {totalCargos > 0 && (
            <div className="hidden items-center gap-2 border-r border-slate-200 pr-3 sm:flex lg:gap-3">
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
              <span className="hidden 2xl:inline">Etiquetas de Empresa</span>
            </button>
          )}
        </div>
      </motion.div>
    </header>
  )
}
