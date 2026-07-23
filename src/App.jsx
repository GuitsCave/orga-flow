import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { AlertTriangle, CheckCircle2, Users, X } from 'lucide-react'
import Toolbar from './components/Toolbar.jsx'
import OrgCanvas from './components/OrgCanvas.jsx'
import PessoaForm from './components/PessoaForm.jsx'
import EmpresasModal from './components/EmpresasModal.jsx'
import Tour from './components/Tour.jsx'
import ModalCenario from './components/ModalCenario.jsx'
import ModalCopiarBloco from './components/ModalCopiarBloco.jsx'
import TabelaView from './components/TabelaView.jsx'
import CartoesView from './components/CartoesView.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import {
  useOrgChart,
  listarBackups,
  lerBackup,
  descartarBackups,
  guardarBackupDoAtual,
} from './hooks/useOrgChart.js'
import { baixarTexto } from './lib/arquivo.js'
import { APP_VERSION } from './lib/versao.js'
import { SEM_EMPRESA, comDescendentes, empresasEfetivas } from './lib/modelo.js'

export default function App() {
  const {
    dados,
    cenarios,
    cenarioAtivoId,
    cenarioAtivo,
    setEmpresa,
    setLayoutManual,
    salvarPessoa,
    excluirPessoa,
    moverPessoa,
    reordenarPessoa,
    alterarNivelBloco,
    alterarNivelEquipe,
    limparPosicoes,
    salvarEmpresa,
    excluirEmpresa,
    reordenarEmpresas,
    substituirDados,
    selecionarCenario,
    criarCenario,
    duplicarCenario,
    renomearCenario,
    excluirCenario,
    copiarPessoasParaCenario,
  } = useOrgChart()

  // null = painel fechado; 'nova' = criando; id = editando
  const [painel, setPainel] = useState(null)
  const [modoVisao, setModoVisao] = useState('canvas') // 'canvas' | 'tabela' | 'cartoes'
  const [modalCenario, setModalCenario] = useState({ aberto: false, modo: 'novo', cenario: null })
  const [modalCopiarBloco, setModalCopiarBloco] = useState({ aberto: false, pessoa: null })
  // gestor pré-selecionado ao criar via "+" de um bloco gestor
  const [gestorPreset, setGestorPreset] = useState(null)
  // filtro de profundidade (array com múltiplos níveis selecionados)
  const [filtroNiveis, setFiltroNiveis] = useState([])
  // filtros independentes por área e por setor (arrays para múltiplos valores)
  const [filtroArea, setFiltroArea] = useState([])
  const [filtroSetor, setFiltroSetor] = useState([])
  // filtro por empresa (ids) e exibição das etiquetas — também view-only
  const [filtroEmpresas, setFiltroEmpresas] = useState([])
  // filtro por gestor: mostra a árvore abaixo de cada gestor escolhido
  const [filtroGestores, setFiltroGestores] = useState([])
  const [mostrarEtiquetasEmpresa, setMostrarEtiquetasEmpresa] = useState(true)
  const [modalEmpresas, setModalEmpresas] = useState(false)
  const [paletaAberta, setPaletaAberta] = useState(false)
  // Passo a passo: abre sozinho no primeiro acesso e fica no botão "?"
  // localStorage pode lançar (modo privado, cookies bloqueados) — nunca deixe
  // isso derrubar a renderização do app.
  const [tourAberto, setTourAberto] = useState(() => {
    try {
      return !localStorage.getItem('orga:tour-visto')
    } catch {
      return false
    }
  })

  const fecharTour = () => {
    try {
      localStorage.setItem('orga:tour-visto', '1')
    } catch {
      /* storage indisponível */
    }
    setTourAberto(false)
  }

  // Dados que não puderam ser abertos ficam guardados para recuperação
  const [backups, setBackups] = useState(listarBackups)

  // Excluir um cenário grava um backup dentro de um updater assíncrono; o número
  // de cenários muda só em criar/excluir/importar, então é o gatilho certo (e
  // barato) para reavaliar a faixa de recuperação sem depender de ordenação.
  const totalCenarios = cenarios.length
  useEffect(() => {
    setBackups(listarBackups())
  }, [totalCenarios])

  // Avisa quando o app foi atualizado desde a última visita (nunca na 1ª vez).
  // O inicializador só LÊ: gravar aqui quebraria com a dupla execução do StrictMode.
  const [versaoAnterior, setVersaoAnterior] = useState(() => {
    try {
      const vista = localStorage.getItem('orga:versao-vista')
      return vista && vista !== APP_VERSION ? vista : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('orga:versao-vista', APP_VERSION)
    } catch {
      /* storage indisponível */
    }
  }, [])

  // Ctrl/Cmd + K abre (ou fecha) a paleta de comandos de qualquer lugar
  useEffect(() => {
    const aoTeclar = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletaAberta((v) => !v)
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [])

  // Ao alternar entre organogramas/cenários, limpa os filtros ativos e painéis
  useEffect(() => {
    setPainel(null)
    setGestorPreset(null)
    setPessoaIsolada(null)
    setFiltroGestores([])
    setFiltroArea([])
    setFiltroSetor([])
    setFiltroEmpresas([])
    setFiltroNiveis([])
  }, [cenarioAtivoId])
  const [pessoaIsolada, setPessoaIsolada] = useState(null)
  const pessoaSelecionada =
    painel && painel !== 'nova' ? dados.pessoas.find((p) => p.id === painel) : null

  const maiorNivel = dados.pessoas.reduce((m, p) => Math.max(m, p.nivel), 1)

  // Valores distintos de área e de setor, cada um para o seu seletor
  const ordenar = (arr) => [...arr].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const opcoesArea = useMemo(
    () => ordenar(new Set(dados.pessoas.map((p) => p.area?.trim()).filter(Boolean))),
    [dados.pessoas],
  )
  const opcoesSetor = useMemo(
    () => ordenar(new Set(dados.pessoas.map((p) => p.setor?.trim()).filter(Boolean))),
    [dados.pessoas],
  )

  // Gestores disponíveis no filtro, do topo para baixo
  const opcoesGestor = useMemo(
    () =>
      dados.pessoas
        .filter((p) => p.ehGestor)
        .sort((a, b) => a.nivel - b.nivel || (a.nome || a.cargo).localeCompare(b.nome || b.cargo, 'pt-BR'))
        .map((p) => p.id),
    [dados.pessoas],
  )

  const rotuloPessoa = (id) => {
    const p = dados.pessoas.find((x) => x.id === id)
    if (!p) return id
    return p.nome || `Vaga: ${p.cargo}`
  }

  const pessoasVisiveis = useMemo(() => {
    let base = dados.pessoas

    if (pessoaIsolada) {
      const porId = new Map(dados.pessoas.map((p) => [p.id, p]))
      const manter = new Set()
      let atual = porId.get(pessoaIsolada)
      while (atual && !manter.has(atual.id)) {
        manter.add(atual.id)
        atual = atual.gestorId ? porId.get(atual.gestorId) : null
      }
      base = base.filter((p) => manter.has(p.id))
    } else if (
      filtroArea.length > 0 ||
      filtroSetor.length > 0 ||
      filtroEmpresas.length > 0 ||
      filtroGestores.length > 0
    ) {
      // Árvore(s) do(s) gestor(es) escolhido(s): eles e todos abaixo
      const naArvore =
        filtroGestores.length > 0 ? comDescendentes(filtroGestores, dados.pessoas) : null
      const porId = new Map(dados.pessoas.map((p) => [p.id, p]))
      const manter = new Set()
      // Marca quem bate nos filtros e sobe toda a cadeia de gestores até o topo
      for (const p of dados.pessoas) {
        const okArea = filtroArea.length === 0 || filtroArea.includes(p.area?.trim())
        const okSetor = filtroSetor.length === 0 || filtroSetor.includes(p.setor?.trim())
        // Quem não tem empresa marcada herda a do gestor acima. Só calcula a
        // herança quando o filtro está ativo — a busca sobe a cadeia inteira.
        let okEmpresa = true
        if (filtroEmpresas.length > 0) {
          const efetivas = empresasEfetivas(p, porId)
          okEmpresa =
            efetivas.length === 0
              ? filtroEmpresas.includes(SEM_EMPRESA)
              : efetivas.some((id) => filtroEmpresas.includes(id))
        }
        const okGestor = naArvore === null || naArvore.has(p.id)
        if (okArea && okSetor && okEmpresa && okGestor) {
          let atual = p
          while (atual && !manter.has(atual.id)) {
            manter.add(atual.id)
            atual = atual.gestorId ? porId.get(atual.gestorId) : null
          }
        }
      }
      base = base.filter((p) => manter.has(p.id))
    }
    if (filtroNiveis.length > 0) {
      base = base.filter((p) => filtroNiveis.includes(p.nivel))
    }
    return base
  }, [dados.pessoas, filtroArea, filtroSetor, filtroNiveis, filtroEmpresas, filtroGestores, pessoaIsolada])

  const filtrosAtivos =
    filtroArea.length +
    filtroSetor.length +
    filtroEmpresas.length +
    filtroGestores.length +
    filtroNiveis.length +
    (pessoaIsolada ? 1 : 0)

  const limparFiltros = () => {
    setFiltroArea([])
    setFiltroSetor([])
    setFiltroEmpresas([])
    setFiltroGestores([])
    setFiltroNiveis([])
    setPessoaIsolada(null)
  }

  // Estável entre renders para não recriar os nós (e perder a seleção) ao abrir o painel
  const addSubordinado = useCallback((id) => {
    setGestorPreset(id)
    setPainel('nova')
  }, [])

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Toolbar
        dados={dados}
        onEmpresa={setEmpresa}
        onNovaPessoa={() => {
          setGestorPreset(null)
          setPainel('nova')
        }}
        onToggleManual={() => setLayoutManual(!dados.layoutManual)}
        onReorganizar={limparPosicoes}
        filtroNiveis={filtroNiveis}
        maiorNivel={maiorNivel}
        onFiltroNiveis={setFiltroNiveis}
        filtroArea={filtroArea}
        opcoesArea={opcoesArea}
        onFiltroArea={setFiltroArea}
        filtroSetor={filtroSetor}
        opcoesSetor={opcoesSetor}
        onFiltroSetor={setFiltroSetor}
        empresas={dados.empresas ?? []}
        filtroEmpresas={filtroEmpresas}
        onFiltroEmpresas={setFiltroEmpresas}
        filtroGestores={filtroGestores}
        opcoesGestor={opcoesGestor}
        onFiltroGestores={setFiltroGestores}
        rotuloPessoa={rotuloPessoa}
        mostrarEtiquetasEmpresa={mostrarEtiquetasEmpresa}
        onToggleEtiquetas={() => setMostrarEtiquetasEmpresa((v) => !v)}
        onAbrirEmpresas={() => setModalEmpresas(true)}
        filtrosAtivos={filtrosAtivos}
        onLimparFiltros={limparFiltros}
        onAbrirTour={() => setTourAberto(true)}
        pessoasVisiveis={pessoasVisiveis}
        pessoaIsolada={pessoaIsolada}
        onLimparPessoaIsolada={() => setPessoaIsolada(null)}
        cenarios={cenarios}
        cenarioAtivo={cenarioAtivo}
        cenarioAtivoId={cenarioAtivoId}
        onSelecionarCenario={selecionarCenario}
        onAbrirNovoCenario={() => setModalCenario({ aberto: true, modo: 'novo', cenario: null })}
        onAbrirRenomearCenario={(c) => setModalCenario({ aberto: true, modo: 'renomear', cenario: c })}
        onDuplicarCenario={duplicarCenario}
        onExcluirCenario={excluirCenario}
        modoVisao={modoVisao}
        onChangeModoVisao={setModoVisao}
        onImportar={(resultado) => {
          // Só o pacote substitui tudo — aí sim preserva o workspace atual.
          // Import de organograma único apenas adiciona um cenário, sem destruir.
          if (resultado?.tipo === 'pacote') {
            guardarBackupDoAtual()
            setBackups(listarBackups())
          }
          substituirDados(resultado)
          setPainel(null)
        }}
      />

      {versaoAnterior && (
        <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span className="text-emerald-900">
            Aplicativo atualizado da versão <strong>{versaoAnterior}</strong> para a{' '}
            <strong>{APP_VERSION}</strong>. Seu organograma foi mantido — nada precisou ser
            refeito.
          </span>
          <button
            onClick={() => setVersaoAnterior(null)}
            className="ml-auto rounded-md p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Fechar aviso de atualização"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {backups.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span className="text-amber-900">
            Há uma cópia de segurança do organograma anterior (de uma importação ou de dados que
            não puderam ser abertos). Baixe antes de descartar.
          </span>
          <button
            onClick={() => {
              const conteudo = lerBackup(backups[0])
              if (conteudo) baixarTexto('orga-backup.json', conteudo)
            }}
            className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Baixar backup
          </button>
          <button
            onClick={() => {
              descartarBackups()
              setBackups([])
            }}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
          >
            Descartar
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main data-tour="canvas" className="relative min-w-0 flex-1 overflow-hidden">
          {dados.pessoas.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Users size={48} strokeWidth={1.5} />
              <p className="text-sm font-medium">
                Nenhuma pessoa cadastrada. Clique em “Adicionar” para começar.
              </p>
            </div>
          ) : modoVisao === 'tabela' ? (
            <TabelaView
              pessoas={pessoasVisiveis}
              todasPessoas={dados.pessoas}
              empresas={dados.empresas ?? []}
              onSelecionar={(id) => setPainel(id)}
              onExcluir={excluirPessoa}
              onAddSubordinado={addSubordinado}
              rotuloPessoa={rotuloPessoa}
            />
          ) : modoVisao === 'cartoes' ? (
            <CartoesView
              pessoas={pessoasVisiveis}
              todasPessoas={dados.pessoas}
              empresas={dados.empresas ?? []}
              onSelecionar={(id) => setPainel(id)}
              onExcluir={excluirPessoa}
              onAddSubordinado={addSubordinado}
            />
          ) : (
            <ReactFlowProvider>
              <OrgCanvas
                pessoas={pessoasVisiveis}
                todasPessoas={dados.pessoas}
                empresas={dados.empresas ?? []}
                mostrarEtiquetasEmpresa={mostrarEtiquetasEmpresa}
                layoutManual={dados.layoutManual}
                onSelecionar={(id) => setPainel(id)}
                onMover={moverPessoa}
                onAddSubordinado={addSubordinado}
                onFiltrarEquipe={(id) => {
                  const pessoa = dados.pessoas.find((p) => p.id === id)
                  if (!pessoa) return
                  const targetId = (pessoa.ehGestor || !pessoa.gestorId) ? pessoa.id : pessoa.gestorId
                  setFiltroGestores([targetId])
                  setPessoaIsolada(null) // Garante que limpa o isolamento ao exibir equipe
                  // Limpa o filtro de empresa: mantê-lo esconderia membros da
                  // própria equipe cuja empresa efetiva difere da do gestor.
                  setFiltroEmpresas([])
                }}
                onIsolarBloco={(id) => {
                  setPessoaIsolada(id)
                  setFiltroGestores([]) // Limpa o filtro de equipe ao isolar
                }}
                onReordenar={reordenarPessoa}
                onAlterarNivelBloco={alterarNivelBloco}
                onAlterarNivelEquipe={alterarNivelEquipe}
                onAbrirCopiarBloco={(p) => setModalCopiarBloco({ aberto: true, pessoa: p })}
              />
            </ReactFlowProvider>
          )}
        </main>

        {painel && (
          <PessoaForm
            pessoa={pessoaSelecionada}
            gestorInicial={painel === 'nova' ? gestorPreset : null}
            pessoas={dados.pessoas}
            empresas={dados.empresas ?? []}
            onSalvar={salvarPessoa}
            onExcluir={excluirPessoa}
            onFechar={() => setPainel(null)}
          />
        )}
      </div>

      {paletaAberta && (
        <CommandPalette
          pessoas={dados.pessoas}
          cenarios={cenarios}
          cenarioAtivoId={cenarioAtivoId}
          modoVisao={modoVisao}
          layoutManual={dados.layoutManual}
          onIrParaPessoa={(id) => {
            setPessoaIsolada(id)
            setFiltroGestores([])
            setModoVisao('canvas')
          }}
          onNovaPessoa={() => {
            setGestorPreset(null)
            setPainel('nova')
          }}
          onAbrirEmpresas={() => setModalEmpresas(true)}
          onAbrirNovoCenario={() => setModalCenario({ aberto: true, modo: 'novo', cenario: null })}
          onSelecionarCenario={selecionarCenario}
          onChangeModoVisao={setModoVisao}
          onToggleManual={() => setLayoutManual(!dados.layoutManual)}
          onAbrirTour={() => setTourAberto(true)}
          onFechar={() => setPaletaAberta(false)}
        />
      )}

      {tourAberto && <Tour onFechar={fecharTour} />}

      {modalEmpresas && (
        <EmpresasModal
          empresas={dados.empresas ?? []}
          pessoas={dados.pessoas}
          onSalvar={salvarEmpresa}
          onExcluir={excluirEmpresa}
          onReordenar={reordenarEmpresas}
          onFechar={() => setModalEmpresas(false)}
        />
      )}

      {/* Montados só quando abertos: os modais chamam hooks, então não podem
          existir na árvore com um return condicional interno. */}
      {modalCenario.aberto && (
        <ModalCenario
          modoInicial={modalCenario.modo}
          cenarioParaRenomear={modalCenario.cenario}
          cenarios={cenarios}
          cenarioAtivo={cenarioAtivo}
          onCriarCenario={criarCenario}
          onRenomearCenario={renomearCenario}
          onFechar={() => setModalCenario({ aberto: false, modo: 'novo', cenario: null })}
        />
      )}

      {modalCopiarBloco.aberto && modalCopiarBloco.pessoa && (
        <ModalCopiarBloco
          pessoa={modalCopiarBloco.pessoa}
          cenarios={cenarios}
          cenarioAtivoId={cenarioAtivoId}
          onCopiar={copiarPessoasParaCenario}
          onFechar={() => setModalCopiarBloco({ aberto: false, pessoa: null })}
        />
      )}
    </div>
  )
}
