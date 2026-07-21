import {
  COR_EMPRESA_PADRAO,
  CURRENT_VERSION,
  normalizarEmpresas,
  normalizarGestores,
} from './modelo.js'
import { APP_VERSION } from './versao.js'

/** Dispara o download de um texto como arquivo */
export function baixarTexto(nomeArquivo, conteudo) {
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Exporta os dados como download de organograma.json.
 *
 * O arquivo leva duas informações de versão, com papéis diferentes:
 * - `version`: versão do FORMATO dos dados, usada na importação para migrar.
 * - `appVersion`: versão do APLICATIVO que gerou o arquivo, apenas informativa.
 */
export function exportarJson(dados) {
  const conteudo = {
    ...dados,
    version: CURRENT_VERSION,
    appVersion: APP_VERSION,
    exportadoEm: new Date().toISOString(),
  }
  baixarTexto('organograma.json', JSON.stringify(conteudo, null, 2))
}

/**
 * Valida e normaliza um JSON importado.
 * Retorna { dados } em caso de sucesso ou { erro } com mensagem amigável.
 */
export function validarImportacao(texto) {
  let bruto
  try {
    bruto = JSON.parse(texto)
  } catch {
    return { erro: 'O arquivo não é um JSON válido.' }
  }

  if (typeof bruto !== 'object' || bruto === null || !Array.isArray(bruto.pessoas)) {
    return { erro: 'Estrutura inválida: esperado um objeto com a lista "pessoas".' }
  }

  // Cadastro de empresas (opcional — arquivos antigos não têm)
  const empresas = []
  const idsEmpresa = new Set()
  if (bruto.empresas !== undefined) {
    if (!Array.isArray(bruto.empresas)) {
      return { erro: 'Estrutura inválida: "empresas" precisa ser uma lista.' }
    }
    for (let i = 0; i < bruto.empresas.length; i++) {
      const e = bruto.empresas[i]
      if (typeof e !== 'object' || e === null) {
        return { erro: `Empresa na posição ${i + 1} não é um objeto válido.` }
      }
      if (!e.id || typeof e.id !== 'string') {
        return { erro: `Empresa na posição ${i + 1} está sem "id".` }
      }
      if (idsEmpresa.has(e.id)) {
        return { erro: `Id de empresa duplicado: "${e.id}".` }
      }
      if (!e.nome || typeof e.nome !== 'string') {
        return { erro: `Empresa "${e.id}" está sem "nome".` }
      }
      idsEmpresa.add(e.id)
      empresas.push({
        id: e.id,
        nome: e.nome,
        cor: typeof e.cor === 'string' ? e.cor : COR_EMPRESA_PADRAO,
      })
    }
  }

  const pessoas = []
  const ids = new Set()
  for (let i = 0; i < bruto.pessoas.length; i++) {
    const p = bruto.pessoas[i]
    if (typeof p !== 'object' || p === null) {
      return { erro: `Pessoa na posição ${i + 1} não é um objeto válido.` }
    }
    if (!p.id || typeof p.id !== 'string') {
      return { erro: `Pessoa na posição ${i + 1} está sem "id".` }
    }
    if (ids.has(p.id)) {
      return { erro: `Id duplicado: "${p.id}".` }
    }
    ids.add(p.id)
    const vagaAberta = p.vagaAberta === true
    // Vaga em aberto pode não ter nome (posição sem titular)
    if (!vagaAberta && (!p.nome || typeof p.nome !== 'string')) {
      return { erro: `Pessoa "${p.id}" está sem "nome".` }
    }
    if (!p.cargo || typeof p.cargo !== 'string') {
      return { erro: `"${p.nome || p.id}" está sem "cargo".` }
    }
    const nivel = Number(p.nivel)
    if (!Number.isInteger(nivel) || nivel < 1) {
      return { erro: `"${p.nome}" tem "nivel" inválido (use inteiro a partir de 1).` }
    }
    const posicao =
      p.posicao && typeof p.posicao.x === 'number' && typeof p.posicao.y === 'number'
        ? { x: p.posicao.x, y: p.posicao.y }
        : null
    pessoas.push({
      id: p.id,
      nome: typeof p.nome === 'string' ? p.nome : '',
      cargo: p.cargo,
      nivel,
      vagaAberta,
      area: typeof p.area === 'string' ? p.area : '',
      setor: typeof p.setor === 'string' ? p.setor : '',
      descricao: typeof p.descricao === 'string' ? p.descricao : '',
      gestorId: typeof p.gestorId === 'string' ? p.gestorId : null,
      ehGestor: typeof p.ehGestor === 'boolean' ? p.ehGestor : undefined,
      // Ids inválidos/órfãos são descartados por normalizarEmpresas
      empresaIds: Array.isArray(p.empresaIds)
        ? p.empresaIds.filter((id) => typeof id === 'string')
        : [],
      posicao,
    })
  }

  for (const p of pessoas) {
    if (p.gestorId && !ids.has(p.gestorId)) {
      return { erro: `"${p.nome}" aponta para um gestor inexistente ("${p.gestorId}").` }
    }
    if (p.gestorId === p.id) {
      return { erro: `"${p.nome}" não pode ser gestor de si mesmo.` }
    }
  }

  const cicloEm = detectarCiclo(pessoas)
  if (cicloEm) {
    return { erro: `Hierarquia com ciclo envolvendo "${cicloEm}". Corrija os gestores.` }
  }

  return {
    dados: normalizarEmpresas({
      // Sempre a versão atual: a do arquivo é ignorada de propósito, para um
      // backup antigo continuar podendo ser restaurado.
      version: CURRENT_VERSION,
      empresa: typeof bruto.empresa === 'string' ? bruto.empresa : 'Minha Empresa',
      empresas,
      layoutManual: bruto.layoutManual === true,
      pessoas: normalizarGestores(pessoas),
    }),
  }
}

function detectarCiclo(pessoas) {
  const gestorDe = new Map(pessoas.map((p) => [p.id, p.gestorId]))
  const nomeDe = new Map(pessoas.map((p) => [p.id, p.nome]))
  for (const p of pessoas) {
    let lento = p.id
    const vistos = new Set()
    while (lento) {
      if (vistos.has(lento)) return nomeDe.get(lento)
      vistos.add(lento)
      lento = gestorDe.get(lento) ?? null
    }
  }
  return null
}
