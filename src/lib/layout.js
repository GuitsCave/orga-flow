export const NODE_WIDTH = 240
export const NODE_HEIGHT = 96
const NODE_GAP_X = 40 // espaço mínimo horizontal entre blocos da mesma linha
const ROW_GAP_Y = 70 // espaço vertical entre linhas de níveis

export function calcularLayout(pessoas, todasPessoas = []) {
  if (pessoas.length === 0) return {}

  const ids = new Set(pessoas.map((p) => p.id))
  const todasPessoasMap = new Map(todasPessoas.map((p) => [p.id, p]))

  // 1. Determinar o pai visível de cada pessoa
  const paiDe = new Map()
  const filhosDe = new Map()
  for (const p of pessoas) {
    filhosDe.set(p.id, [])
  }

  for (const p of pessoas) {
    if (!p.gestorId) continue
    
    let paiId = null
    if (ids.has(p.gestorId)) {
      paiId = p.gestorId
    } else {
      let atual = todasPessoasMap.get(p.gestorId)
      while (atual) {
        if (ids.has(atual.id)) {
          paiId = atual.id
          break
        }
        atual = atual.gestorId ? todasPessoasMap.get(atual.gestorId) : null
      }
    }
    
    if (paiId) {
      paiDe.set(p.id, paiId)
      filhosDe.get(paiId).push(p)
    }
  }

  // Raízes (pessoas sem gestorId ou cujo gestor não está no grupo filtrado)
  const raizes = pessoas.filter((p) => !paiDe.has(p.id))

  // Obter níveis únicos presentes
  const niveis = [...new Set(pessoas.map((p) => p.nivel))].sort((a, b) => a - b)
  const linhaDoNivel = {}
  niveis.forEach((n, i) => {
    linhaDoNivel[n] = i * (NODE_HEIGHT + ROW_GAP_Y)
  })

  // Função recursiva para calcular o layout de um nó
  // Retorna { x, width, subposicoes: { id: x } }
  function layoutNode(nodeId) {
    const p = todasPessoasMap.get(nodeId)
    const filhos = filhosDe.get(nodeId) || []

    if (filhos.length === 0) {
      return {
        x: 0,
        width: NODE_WIDTH,
        subposicoes: { [nodeId]: 0 }
      }
    }

    const layoutsFilhos = filhos.map((filho) => layoutNode(filho.id))
    const offsetsFilhos = []
    let currentX = 0

    for (let i = 0; i < layoutsFilhos.length; i++) {
      offsetsFilhos.push(currentX)
      currentX += layoutsFilhos[i].width + NODE_GAP_X
    }

    const childrenWidth = currentX - NODE_GAP_X

    const primeiroFilhoCentro = offsetsFilhos[0] + layoutsFilhos[0].x + NODE_WIDTH / 2
    const ultimoFilhoCentro = offsetsFilhos[offsetsFilhos.length - 1] + layoutsFilhos[layoutsFilhos.length - 1].x + NODE_WIDTH / 2
    const paiCentro = (primeiroFilhoCentro + ultimoFilhoCentro) / 2
    let paiX = paiCentro - NODE_WIDTH / 2

    let shift = 0
    if (paiX < 0) {
      shift = -paiX
    }

    paiX += shift
    for (let i = 0; i < offsetsFilhos.length; i++) {
      offsetsFilhos[i] += shift
    }

    const subposicoes = { [nodeId]: paiX }
    for (let i = 0; i < filhos.length; i++) {
      const childLayout = layoutsFilhos[i]
      const childOffset = offsetsFilhos[i]
      for (const id in childLayout.subposicoes) {
        subposicoes[id] = childLayout.subposicoes[id] + childOffset
      }
    }

    const totalWidth = Math.max(paiX + NODE_WIDTH, childrenWidth + shift)

    return {
      x: paiX,
      width: totalWidth,
      subposicoes
    }
  }

  const layoutsRaizes = raizes.map((r) => layoutNode(r.id))
  const posicoes = {}
  let currentOffset = 0

  for (let i = 0; i < layoutsRaizes.length; i++) {
    const rootLayout = layoutsRaizes[i]

    for (const id in rootLayout.subposicoes) {
      const p = todasPessoasMap.get(id)
      posicoes[id] = {
        x: rootLayout.subposicoes[id] + currentOffset,
        y: linhaDoNivel[p.nivel]
      }
    }

    currentOffset += rootLayout.width + NODE_GAP_X
  }

  return posicoes
}

/**
 * Converte a lista de pessoas em nodes/edges do React Flow.
 * No modo manual, usa a posição salva da pessoa quando existir.
 */
export function paraFluxo(pessoas, layoutManual, todasPessoas = []) {
  const auto = calcularLayout(pessoas, todasPessoas)
  const ids = new Set(pessoas.map((p) => p.id))
  const todasPessoasMap = new Map(todasPessoas.map((p) => [p.id, p]))

  const nodes = pessoas.map((p) => ({
    id: p.id,
    type: 'pessoa',
    position: layoutManual && p.posicao ? p.posicao : auto[p.id],
    data: { pessoa: p },
    draggable: layoutManual,
  }))

  const edges = []
  for (const p of pessoas) {
    if (!p.gestorId) continue

    // Conexão direta se o gestor imediato está visível
    if (ids.has(p.gestorId)) {
      edges.push({
        id: `e-${p.gestorId}-${p.id}`,
        source: p.gestorId,
        target: p.id,
        type: 'smoothstep',
      })
    } else {
      // Subir na árvore (lista completa) para achar o gestor visível mais próximo
      let atual = todasPessoasMap.get(p.gestorId)
      while (atual) {
        if (ids.has(atual.id)) {
          edges.push({
            id: `e-${atual.id}-${p.id}`,
            source: atual.id,
            target: p.id,
            type: 'smoothstep',
            style: { strokeDasharray: '5,5', stroke: '#94a3b8' }, // Linha tracejada cor cinza slate-400
            animated: true, // Efeito animado super premium
          })
          break
        }
        atual = atual.gestorId ? todasPessoasMap.get(atual.gestorId) : null
      }
    }
  }

  return { nodes, edges }
}
