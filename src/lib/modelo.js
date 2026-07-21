/**
 * Garante o campo ehGestor em todas as pessoas.
 * Regra de integridade: quem tem subordinado é sempre gestor (mesmo que o campo
 * tenha sido salvo como false). Sem subordinado, respeita o valor informado e,
 * na ausência dele (dados antigos), assume false.
 */
export function normalizarGestores(pessoas) {
  const temSubordinado = new Set(pessoas.map((p) => p.gestorId).filter(Boolean))
  return pessoas.map((p) => ({
    ...p,
    ehGestor: temSubordinado.has(p.id) || p.ehGestor === true,
  }))
}

/**
 * Versão do formato dos dados. FONTE ÚNICA — importe daqui, nunca repita o número.
 * Duplicar esse valor já causou perda de dados: se a constante e o literal usado
 * na importação saem de sincronia, o arquivo importado é salvo com uma versão que
 * o carregamento não reconhece.
 */
export const CURRENT_VERSION = 2

/**
 * Traz dados de versões anteriores para o formato atual.
 * Devolve `null` só quando é impossível aproveitar (estrutura inválida ou versão
 * mais nova que esta build) — nesses casos o chamador deve preservar o original,
 * nunca descartar.
 */
export function migrarDados(dados) {
  if (!dados || typeof dados !== 'object' || !Array.isArray(dados.pessoas)) return null

  // Sem o campo = formato inicial (v1), anterior ao cadastro de empresas
  const versao = typeof dados.version === 'number' ? dados.version : 1
  if (versao > CURRENT_VERSION) return null // veio de uma versão mais nova do app

  // v1 → v2: os campos de empresa passaram a existir. Como toda mudança até aqui
  // foi aditiva, os normalizadores dão conta de preencher os padrões.
  return normalizarEmpresas({
    ...dados,
    version: CURRENT_VERSION,
    pessoas: normalizarGestores(dados.pessoas),
  })
}

/**
 * Os ids informados somados a todos os seus descendentes.
 * Usado pelo filtro de gestor: selecionar alguém traz a árvore inteira abaixo.
 */
export function comDescendentes(ids, pessoas) {
  const filhosPor = new Map()
  for (const p of pessoas) {
    if (!p.gestorId) continue
    if (!filhosPor.has(p.gestorId)) filhosPor.set(p.gestorId, [])
    filhosPor.get(p.gestorId).push(p.id)
  }

  const resultado = new Set()
  const fila = [...ids]
  while (fila.length) {
    const atual = fila.pop()
    if (resultado.has(atual)) continue // também protege contra ciclo
    resultado.add(atual)
    for (const filho of filhosPor.get(atual) ?? []) fila.push(filho)
  }
  return resultado
}

/** Valor especial do filtro para "cargos ainda sem empresa definida". */
export const SEM_EMPRESA = '__sem_empresa__'

/**
 * Empresas que valem para uma pessoa no filtro.
 *
 * O vínculo próprio sempre vale. Quem não tem vínculo herda o do gestor, mas
 * só de um gestor de UMA empresa: um cargo marcado com várias é corporativo
 * (atende o grupo todo) e não define a empresa do ramo abaixo dele.
 * Retorna [] quando não há vínculo próprio nem herança aplicável.
 */
export function empresasEfetivas(pessoa, porId) {
  const proprias = pessoa?.empresaIds ?? []
  if (proprias.length > 0) return proprias

  const visitados = new Set([pessoa?.id])
  let atual = pessoa?.gestorId ? porId.get(pessoa.gestorId) : null
  while (atual && !visitados.has(atual.id)) {
    visitados.add(atual.id)
    const ids = atual.empresaIds ?? []
    if (ids.length > 1) return [] // gestor corporativo: não propaga
    if (ids.length === 1) return ids
    atual = atual.gestorId ? porId.get(atual.gestorId) : null
  }
  return []
}

/** Paleta de cores para as etiquetas de empresa (escolhidas no cadastro). */
export const CORES_EMPRESA = [
  '#2563eb', // azul
  '#0d9488', // teal
  '#d97706', // âmbar
  '#9333ea', // roxo
  '#dc2626', // vermelho
  '#059669', // verde
  '#db2777', // rosa
  '#475569', // cinza
]

export const COR_EMPRESA_PADRAO = CORES_EMPRESA[0]

/**
 * Garante o cadastro de empresas e o vínculo das pessoas.
 * Campos são aditivos: dados salvos antes das empresas continuam válidos.
 * `empresaIds` vazio significa "sem empresa definida" — a pessoa aparece sempre.
 * Ids que apontam para empresa inexistente são descartados (auto-cura).
 */
export function normalizarEmpresas(dados) {
  const empresas = Array.isArray(dados.empresas)
    ? dados.empresas.filter((e) => e && typeof e.id === 'string')
    : []
  const idsValidos = new Set(empresas.map((e) => e.id))

  return {
    ...dados,
    empresas,
    pessoas: dados.pessoas.map((p) => ({
      ...p,
      empresaIds: Array.isArray(p.empresaIds)
        ? p.empresaIds.filter((id) => idsValidos.has(id))
        : [],
    })),
  }
}
