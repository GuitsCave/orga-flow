import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react'
import { toPng } from 'html-to-image'
import { GitFork, Target, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Copy } from 'lucide-react'
import PessoaNode, { corDoNivel } from './PessoaNode.jsx'
import { paraFluxo } from '../lib/layout.js'

// Margem ao redor da árvore inteira na imagem exportada
const MARGEM_EXPORTACAO = 48

const nodeTypes = { pessoa: PessoaNode }

export default function OrgCanvas({
  pessoas,
  todasPessoas = [],
  empresas = [],
  mostrarEtiquetasEmpresa = true,
  layoutManual,
  onSelecionar,
  onMover,
  onAddSubordinado,
  onFiltrarEquipe,
  onIsolarBloco,
  onReordenar,
  onAlterarNivelBloco,
  onAlterarNivelEquipe,
  onAbrirCopiarBloco,
  aoRegistrarExportacaoImagem,
}) {
  const empresasPorId = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  // Posições e ligações: só mudam com os dados/layout. Mantido separado do que
  // é puramente visual para o reenquadre não disparar a cada troca de etiqueta.
  const { nodes: nodesPosicionados, edges: edgesCalc } = useMemo(
    () => paraFluxo(pessoas, layoutManual, todasPessoas),
    [pessoas, layoutManual, todasPessoas],
  )

  const nodesCalc = useMemo(
    () =>
      nodesPosicionados.map((n) => ({
        ...n,
        data: { ...n.data, onAddSubordinado, empresas, empresasPorId, mostrarEtiquetasEmpresa },
      })),
    [nodesPosicionados, onAddSubordinado, empresas, empresasPorId, mostrarEtiquetasEmpresa],
  )

  // Assinatura de QUAIS blocos estão na tela. O reenquadre automático depende
  // dela, e não das posições: reordenar irmãos ou mudar nível reposiciona tudo,
  // mas não é motivo para jogar fora o zoom e o enquadramento do usuário.
  const chaveVisiveis = useMemo(
    () => nodesPosicionados.map((n) => n.id).sort().join('|'),
    [nodesPosicionados],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesCalc)
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesCalc)
  const { fitView, getNodes } = useReactFlow()
  const [menuContexto, setMenuContexto] = useState(null)

  // Exporta a árvore inteira (não só o que está enquadrado na tela) como PNG:
  // calcula o enquadramento que caberia todos os nós e aplica isso só na
  // imagem exportada via html-to-image, sem mexer no zoom/pan que o usuário
  // está vendo. Reflete o que a tela mostra no momento — filtros, bloco
  // isolado e nomes mascarados pelo modo confidencial já vêm prontos nos nós.
  const exportarComoImagem = useCallback(async () => {
    // getNodes() lê o estado interno do React Flow, que só é resincronizado
    // com `pessoas` (o filtro atual) dentro do useEffect abaixo — depois do
    // render, não durante. Cruza com os ids de `pessoas` (sempre atual, é a
    // prop) para nunca exportar um nó que já saiu do filtro mas ainda não foi
    // removido da store interna.
    const idsVisiveis = new Set(pessoas.map((p) => p.id))
    const nosAtuais = getNodes().filter((n) => idsVisiveis.has(n.id))
    if (nosAtuais.length === 0) return

    const bounds = getNodesBounds(nosAtuais)
    const largura = bounds.width + MARGEM_EXPORTACAO * 2
    const altura = bounds.height + MARGEM_EXPORTACAO * 2
    // getViewportForBounds trata um padding numérico como FRAÇÃO do tamanho da
    // imagem (0.1 = 10%), não pixels — precisa da string "Npx" para pixels
    // absolutos, senão o zoom calculado sai completamente errado.
    const viewport = getViewportForBounds(bounds, largura, altura, 0.1, 2, `${MARGEM_EXPORTACAO}px`)

    const elementoViewport = document.querySelector('.react-flow__viewport')
    if (!elementoViewport) return

    const dataUrl = await toPng(elementoViewport, {
      backgroundColor: '#f8fafc',
      width: largura,
      height: altura,
      pixelRatio: 2,
      style: {
        width: `${largura}px`,
        height: `${altura}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    })

    const a = document.createElement('a')
    a.download = `organograma_${new Date().toISOString().slice(0, 10)}.png`
    a.href = dataUrl
    a.click()
  }, [getNodes, pessoas])

  // Registra a função no App enquanto o canvas existe; some quando o usuário
  // troca para Tabela/Cartões (ReactFlowProvider desmonta junto).
  useEffect(() => {
    aoRegistrarExportacaoImagem?.(exportarComoImagem)
    return () => aoRegistrarExportacaoImagem?.(null)
  }, [exportarComoImagem, aoRegistrarExportacaoImagem])

  const pessoaContexto = menuContexto ? todasPessoas.find((p) => p.id === menuContexto.id) : null
  const irmaosContexto = pessoaContexto ? todasPessoas.filter((p) => p.gestorId === pessoaContexto.gestorId) : []
  const idxNoGrupoContexto = irmaosContexto.findIndex((p) => p.id === pessoaContexto?.id)

  const podeSubirBloco = useMemo(() => {
    if (!pessoaContexto) return false
    if (pessoaContexto.nivel <= 1) return false
    if (pessoaContexto.gestorId) {
      const gestor = todasPessoas.find((g) => g.id === pessoaContexto.gestorId)
      if (gestor && pessoaContexto.nivel - 1 <= gestor.nivel) return false
    }
    return true
  }, [pessoaContexto, todasPessoas])

  const podeDescerBloco = useMemo(() => {
    if (!pessoaContexto) return false
    const subordinados = todasPessoas.filter((s) => s.gestorId === pessoaContexto.id)
    if (subordinados.length > 0) {
      const minSubNivel = subordinados.reduce((m, s) => Math.min(m, s.nivel), Infinity)
      if (pessoaContexto.nivel + 1 >= minSubNivel) return false
    }
    return true
  }, [pessoaContexto, todasPessoas])

  // Subir a equipe inteira tem a mesma restrição de subir o líder (todos sobem
  // juntos). Descer nunca esbarra em nada: os subordinados descem junto.
  const podeSubirEquipe = podeSubirBloco
  const podeDescerEquipe = Boolean(pessoaContexto)

  // Ressincroniza quando os dados ou o modo de layout mudam
  useEffect(() => {
    setNodes(nodesCalc)
    setEdges(edgesCalc)
  }, [nodesCalc, edgesCalc, setNodes, setEdges])

  // Reenquadra ao alternar para layout automático ou mudar a hierarquia
  useEffect(() => {
    if (!layoutManual) {
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50)
      return () => clearTimeout(t)
    }
  }, [layoutManual, chaveVisiveis, fitView])

  // Fecha o menu de contexto ao clicar em qualquer lugar
  useEffect(() => {
    if (!menuContexto) return
    const fecharMenu = () => setMenuContexto(null)
    document.addEventListener('click', fecharMenu)
    return () => document.removeEventListener('click', fecharMenu)
  }, [menuContexto])

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          onSelecionar(node.id)
          setMenuContexto(null)
        }}
        onNodeDragStop={(_, node) => onMover(node.id, node.position)}
        onNodeContextMenu={(event, node) => {
          event.preventDefault()
          const p = todasPessoas.find((x) => x.id === node.id)
          const ehGestor = p?.ehGestor === true
          
          const menuWidth = 220
          const menuHeight = ehGestor ? 320 : 220

          let x = event.clientX
          let y = event.clientY

          if (x + menuWidth > window.innerWidth) {
            x = window.innerWidth - menuWidth - 8
          }
          if (y + menuHeight > window.innerHeight) {
            y = window.innerHeight - menuHeight - 8
          }

          setMenuContexto({
            id: node.id,
            x: Math.max(8, x),
            y: Math.max(8, y),
          })
        }}
        onPaneClick={() => {
          onSelecionar(null)
          setMenuContexto(null)
        }}
        nodesConnectable={false}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={20} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => corDoNivel(n.data.pessoa.nivel)}
          maskColor="rgba(241, 245, 249, 0.7)"
        />
      </ReactFlow>

      {menuContexto && (
        <div
          className="fixed z-50 min-w-[200px] rounded-lg border border-slate-200 bg-white p-1 shadow-md"
          style={{ top: menuContexto.y, left: menuContexto.x }}
        >
          <button
            onClick={() => {
              onFiltrarEquipe(menuContexto.id)
              setMenuContexto(null)
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
          >
            <GitFork size={14} className="text-slate-400" />
            Exibir árvore da equipe
          </button>
          <button
            onClick={() => {
              onIsolarBloco(menuContexto.id)
              setMenuContexto(null)
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
          >
            <Target size={14} className="text-slate-400" />
            Isolar bloco
          </button>

          {irmaosContexto.length > 1 && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                disabled={idxNoGrupoContexto === 0}
                onClick={() => {
                  onReordenar(menuContexto.id, 'esquerda')
                  setMenuContexto(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft size={14} className="text-slate-400" />
                Mover para a esquerda
              </button>
              <button
                disabled={idxNoGrupoContexto === irmaosContexto.length - 1}
                onClick={() => {
                  onReordenar(menuContexto.id, 'direita')
                  setMenuContexto(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight size={14} className="text-slate-400" />
                Mover para a direita
              </button>
            </>
          )}

          {/* Nível do Bloco */}
          <div className="my-1 border-t border-slate-100" />
          <div className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Nível do Bloco
          </div>
          <button
            disabled={!podeSubirBloco}
            onClick={() => {
              onAlterarNivelBloco(menuContexto.id, 'subir')
              setMenuContexto(null)
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Sobe o nível do cargo (reduz o número do nível)"
          >
            <ChevronUp size={14} className="text-slate-400" />
            Subir
          </button>
          <button
            disabled={!podeDescerBloco}
            onClick={() => {
              onAlterarNivelBloco(menuContexto.id, 'descer')
              setMenuContexto(null)
            }}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Desce o nível do cargo (aumenta o número do nível)"
          >
            <ChevronDown size={14} className="text-slate-400" />
            Descer
          </button>

          {/* Nível da Equipe */}
          {pessoaContexto?.ehGestor && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <div className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Nível da Equipe
              </div>
              <button
                disabled={!podeSubirEquipe}
                onClick={() => {
                  onAlterarNivelEquipe(menuContexto.id, 'subir')
                  setMenuContexto(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Sobe o nível de toda a equipe sob esta gestão (reduz os números de nível)"
              >
                <ChevronsUp size={14} className="text-slate-400" />
                Subir
              </button>
              <button
                disabled={!podeDescerEquipe}
                onClick={() => {
                  onAlterarNivelEquipe(menuContexto.id, 'descer')
                  setMenuContexto(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Desce o nível de toda a equipe sob esta gestão (aumenta os números de nível)"
              >
                <ChevronsDown size={14} className="text-slate-400" />
                Descer
              </button>
            </>
          )}

          {/* Copiar para outro organograma */}
          {onAbrirCopiarBloco && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => {
                  onAbrirCopiarBloco(pessoaContexto)
                  setMenuContexto(null)
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900 cursor-pointer transition-colors"
                title="Copiar este bloco ou equipe para outro organograma"
              >
                <Copy size={14} className="text-brand-600" />
                Copiar para outro organograma...
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
