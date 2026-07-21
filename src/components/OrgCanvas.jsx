import { useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import { GitFork, Target, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react'
import PessoaNode, { corDoNivel } from './PessoaNode.jsx'
import { paraFluxo } from '../lib/layout.js'

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
}) {
  const empresasPorId = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const { nodes: nodesCalc, edges: edgesCalc } = useMemo(() => {
    const fluxo = paraFluxo(pessoas, layoutManual, todasPessoas)
    return {
      ...fluxo,
      nodes: fluxo.nodes.map((n) => ({
        ...n,
        data: { ...n.data, onAddSubordinado, empresasPorId, mostrarEtiquetasEmpresa },
      })),
    }
  }, [
    pessoas,
    layoutManual,
    todasPessoas,
    onAddSubordinado,
    empresasPorId,
    mostrarEtiquetasEmpresa,
  ])

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesCalc)
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesCalc)
  const { fitView } = useReactFlow()
  const [menuContexto, setMenuContexto] = useState(null)

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

  const podeSubirEquipe = useMemo(() => {
    if (!pessoaContexto) return false
    return podeSubirBloco
  }, [pessoaContexto, podeSubirBloco])

  const podeDescerEquipe = useMemo(() => {
    if (!pessoaContexto) return false
    return true
  }, [pessoaContexto])

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
  }, [layoutManual, nodesCalc, fitView])

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
        </div>
      )}
    </>
  )
}
