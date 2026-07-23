import { useRef, useState } from 'react'
import {
  Building2,
  Check,
  Download,
  Eye,
  EyeOff,
  Filter,
  HelpCircle,
  LayoutGrid,
  Move,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Table,
  Tag,
  Upload,
  Contact,
  X,
} from 'lucide-react'
import { exportarJson, validarImportacao } from '../lib/arquivo.js'
import { SEM_EMPRESA } from '../lib/modelo.js'
import { APP_VERSION, dataBuildFormatada } from '../lib/versao.js'
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

export default function Toolbar({
  dados,
  onEmpresa,
  onNovaPessoa,
  onToggleManual,
  onReorganizar,
  onImportar,
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
  onAbrirEmpresas,
  filtrosAtivos = 0,
  onLimparFiltros,
  pessoasVisiveis = [],
  pessoaIsolada = null,
  onLimparPessoaIsolada,
  onAbrirTour,
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
}) {
  const inputArquivo = useRef(null)
  const [erroImport, setErroImport] = useState('')
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

  function aoEscolherArquivo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    const leitor = new FileReader()
    leitor.onerror = () => setErroImport('Não foi possível ler o arquivo escolhido.')
    leitor.onload = () => {
      const resultado = validarImportacao(leitor.result)
      if (resultado.erro) {
        setErroImport(resultado.erro)
      } else {
        setErroImport('')
        onImportar(resultado)
      }
    }
    leitor.readAsText(arquivo)
  }

  const botao =
    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors'

  const divisor = <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" aria-hidden />
  const iconeBotao =
    'flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'

  return (
    <header className="border-b border-slate-200 bg-white">
      {/* Faixa 1 — identidade e ações */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex shrink-0 items-center gap-2 text-brand-900">
          <Network size={22} />
          <span className="text-base font-extrabold tracking-tight">Orga</span>
          <span className="text-[10px] text-slate-400 font-medium select-none ml-1 self-end mb-0.5 whitespace-nowrap">
            por{' '}
            <a
              href="https://guitstech.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-500 hover:text-brand-600 transition-colors"
            >
              Guitstech
            </a>
          </span>
        </div>

        {divisor}

        <CenarioSelector
          cenarios={cenarios}
          cenarioAtivo={cenarioAtivo}
          onSelecionarCenario={onSelecionarCenario}
          onAbrirNovoCenario={onAbrirNovoCenario}
          onAbrirRenomearCenario={onAbrirRenomearCenario}
          onDuplicarCenario={onDuplicarCenario}
          onExcluirCenario={onExcluirCenario}
        />

        {divisor}

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
              className="w-48 rounded-lg border border-slate-300 px-2 py-0.5 text-base font-semibold text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              aria-label="Nome do grupo"
              placeholder="Nome do grupo"
            />
            <button
              onClick={() => {
                onEmpresa(nomeEmpresa)
                setEditandoEmpresa(false)
              }}
              className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              title="Salvar"
            >
              <Check size={16} />
            </button>
            <button
              onMouseDown={(e) => {
                // Previne o blur do input de fechar antes do click ser processado
                e.preventDefault()
              }}
              onClick={() => setEditandoEmpresa(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            data-tour="grupo"
            className="flex items-center gap-1 group max-w-xs md:max-w-md lg:max-w-lg"
          >
            <span
              className="truncate px-2 py-0.5 text-base font-semibold text-slate-800"
            >
              {dados.empresa || 'Nome do grupo'}
            </span>
            <button
              onClick={() => {
                setNomeEmpresa(dados.empresa)
                setEditandoEmpresa(true)
              }}
              className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              title="Editar nome do grupo"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}

        {/* Bloco de estatísticas */}
        {totalCargos > 0 && (
          <div className="hidden md:flex items-center gap-2 lg:gap-3 border-l border-slate-200 pl-3 lg:pl-4">
            <div className="flex items-baseline gap-1 xl:flex-col xl:items-start xl:gap-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cargos</span>
              <span className="text-xs font-semibold text-slate-800" title={`${visiveisCargos} cargos visíveis de um total de ${totalCargos}`}>
                {temFiltro ? `${visiveisCargos}/${totalCargos}` : totalCargos}
              </span>
            </div>
            
            <div className="h-4 xl:h-6 w-px bg-slate-200" />
            
            <div className="flex items-baseline gap-1 xl:flex-col xl:items-start xl:gap-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pessoas</span>
              <span className="text-xs font-semibold text-slate-800" title={`${visiveisPessoasAtivas} pessoas ocupadas de um total de ${totalPessoasAtivas}`}>
                {temFiltro ? `${visiveisPessoasAtivas}/${totalPessoasAtivas}` : totalPessoasAtivas}
              </span>
            </div>
            
            <div className="h-4 xl:h-6 w-px bg-slate-200" />
            
            <div className="flex items-baseline gap-1 xl:flex-col xl:items-start xl:gap-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gestores</span>
              <span className="text-xs font-semibold text-slate-800" title={`${visiveisGestores} gestores visíveis de um total de ${totalGestores}`}>
                {temFiltro ? `${visiveisGestores}/${totalGestores}` : totalGestores}
              </span>
            </div>
            
            <div className="h-4 xl:h-6 w-px bg-slate-200" />
            
            <div className="flex items-baseline gap-1 xl:flex-col xl:items-start xl:gap-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vagas</span>
              <span className="text-xs font-semibold text-slate-800" title={`${visiveisVagas} vagas em aberto de um total de ${totalVagas}`}>
                {temFiltro ? `${visiveisVagas}/${totalVagas}` : totalVagas}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Seletor de Modo de Visualização */}
        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => onChangeModoVisao('canvas')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              modoVisao === 'canvas'
                ? 'bg-white text-brand-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visão Organograma (Canvas de Árvore)"
          >
            <Network className="h-3.5 w-3.5 text-brand-600" />
            <span className="hidden sm:inline">Organograma</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeModoVisao('tabela')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              modoVisao === 'tabela'
                ? 'bg-white text-brand-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visão Tabela (Diretório pesquisável e Excel)"
          >
            <Table className="h-3.5 w-3.5 text-brand-600" />
            <span className="hidden sm:inline">Tabela</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeModoVisao('cartoes')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              modoVisao === 'cartoes'
                ? 'bg-white text-brand-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visão Cartões (Agrupado por Departamento)"
          >
            <Contact className="h-3.5 w-3.5 text-brand-600" />
            <span className="hidden sm:inline">Cartões</span>
          </button>
        </div>

        {divisor}

        <div className="flex shrink-0 items-center gap-2">
          <button
            data-tour="adicionar"
            onClick={onNovaPessoa}
            className={`${botao} bg-brand-600 text-white shadow-sm hover:bg-brand-700`}
          >
            <Plus size={16} /> Adicionar
          </button>

          <button
            data-tour="empresas"
            onClick={onAbrirEmpresas}
            className={`${botao} bg-slate-100 text-slate-700 hover:bg-slate-200`}
            title="Cadastrar as empresas do grupo"
          >
            <Building2 size={16} />
            <span className="hidden lg:inline">Empresas</span>
          </button>

          {divisor}

          <button
            data-tour="layout"
            onClick={onToggleManual}
            className={`${botao} ${dados.layoutManual
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            title={
              dados.layoutManual
                ? 'Modo manual ativo: arraste os blocos livremente'
                : 'Layout automático ativo: organizado por níveis'
            }
          >
            {dados.layoutManual ? <Move size={16} /> : <LayoutGrid size={16} />}
            {dados.layoutManual ? 'Manual' : 'Automático'}
          </button>

          {dados.layoutManual && (
            <button
              onClick={onReorganizar}
              className={`${botao} bg-slate-100 text-slate-700 hover:bg-slate-200`}
              title="Descarta as posições manuais e volta ao layout automático"
            >
              <RotateCcw size={16} />
              <span className="hidden lg:inline">Reorganizar</span>
            </button>
          )}

          {divisor}

          <span data-tour="arquivo" className="flex items-center gap-2">
            <button
              onClick={() => exportarJson({ cenarios, cenarioAtivoId, dados })}
              className={iconeBotao}
              title="Exportar backup completo (JSON com todos os organogramas)"
            >
              <Upload size={18} />
            </button>
            <button
              onClick={() => inputArquivo.current?.click()}
              className={iconeBotao}
              title="Importar JSON"
            >
              <Download size={18} />
            </button>
          </span>
          <input
            ref={inputArquivo}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={aoEscolherArquivo}
          />

          {divisor}

          <button
            onClick={onAbrirTour}
            className={iconeBotao}
            title="Ver o passo a passo de como usar o Orga"
            aria-label="Ajuda: passo a passo"
          >
            <HelpCircle size={18} />
          </button>

          <span
            className="flex items-center gap-1.5 shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-500"
            title={
              dataBuildFormatada()
                ? `Versão ${APP_VERSION} — build de ${dataBuildFormatada()} (Operacional)`
                : `Versão ${APP_VERSION} (Operacional)`
            }
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            v{APP_VERSION}
          </span>
        </div>
      </div>

      {/* Faixa 2 — filtros e opções de visualização */}
      <div
        data-tour="filtros"
        className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2"
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
              className="ml-1 rounded-full p-0.5 hover:bg-amber-100 text-amber-600 hover:text-amber-800 cursor-pointer"
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
          {empresas.length > 0 && (
            <button
              onClick={onToggleEtiquetas}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${mostrarEtiquetasEmpresa
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

      {erroImport && (
        <div className="flex items-center justify-between bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          <span>Erro ao importar: {erroImport}</span>
          <button onClick={() => setErroImport('')} className="font-bold hover:underline">
            Fechar
          </button>
        </div>
      )}
    </header>
  )
}
