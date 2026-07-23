import { useCallback, useEffect, useRef, useState } from 'react'
import { EXEMPLO } from '../data/exemplo.js'
import {
  migrarDados,
  comDescendentes,
  normalizarGestores,
  normalizarEmpresas,
  CURRENT_VERSION,
} from '../lib/modelo.js'

const STORAGE_KEY_LEGADO = 'orga:dados'
const STORAGE_KEY_CENARIOS = 'orga:cenarios'
const STORAGE_KEY_ATIVO = 'orga:cenario_ativo'
const PREFIXO_BACKUP = 'orga:backup:'

export function novoId() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// Sufixo aleatório evita colisão em dois cliques no mesmo milissegundo
function novoIdCenario() {
  return `cenario-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Clona um conjunto de pessoas gerando novos IDs e ajustando a hierarquia interna.
 */
export function clonarPessoas(idsParaCopiar, todasPessoas, novoGestorRaizId = null) {
  const idsSet = new Set(idsParaCopiar)
  const mapaNovosIds = new Map()

  for (const id of idsSet) {
    mapaNovosIds.set(id, novoId())
  }

  const clonadas = []
  for (const p of todasPessoas) {
    if (!idsSet.has(p.id)) continue

    const novoIdPessoa = mapaNovosIds.get(p.id)
    const gestorIdNoGrupo = p.gestorId && idsSet.has(p.gestorId)
    const novoGestorId = gestorIdNoGrupo ? mapaNovosIds.get(p.gestorId) : (novoGestorRaizId || null)

    clonadas.push({
      ...JSON.parse(JSON.stringify(p)),
      id: novoIdPessoa,
      gestorId: novoGestorId,
      posicao: null,
    })
  }

  // Se ficou sem gestor externo, ajusta o menor nível para 1 mantendo proporção
  if (!novoGestorRaizId && clonadas.length > 0) {
    const minNivel = clonadas.reduce((min, item) => Math.min(min, item.nivel), Infinity)
    if (minNivel < Infinity && minNivel > 1) {
      const delta = minNivel - 1
      for (const c of clonadas) {
        c.nivel = Math.max(1, c.nivel - delta)
      }
    }
  }

  return normalizarGestores(clonadas)
}

/**
 * Guarda o conteúdo bruto que não pôde ser aberto, para o usuário poder recuperar.
 * REGRA: nada do que o usuário produziu é apagado, em nenhuma hipótese.
 */
function guardarBackup(conteudo) {
  try {
    const jaExiste = listarBackups().some((k) => localStorage.getItem(k) === conteudo)
    if (jaExiste) return
    localStorage.setItem(`${PREFIXO_BACKUP}${Date.now()}`, conteudo)
  } catch {
    // storage cheio
  }
}

export function guardarBackupDoAtual() {
  try {
    const atual = localStorage.getItem(STORAGE_KEY_CENARIOS) || localStorage.getItem(STORAGE_KEY_LEGADO)
    if (!atual) return false
    guardarBackup(atual)
    return true
  } catch {
    return false
  }
}

export function listarBackups() {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIXO_BACKUP))
      .sort()
      .reverse()
  } catch {
    return []
  }
}

export function lerBackup(chave) {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function descartarBackups() {
  for (const chave of listarBackups()) {
    try {
      localStorage.removeItem(chave)
    } catch {
      /* ignora */
    }
  }
}

function carregarCenariosInicial() {
  let cenariosSalvos = null
  let ativoSalvo = null

  try {
    cenariosSalvos = localStorage.getItem(STORAGE_KEY_CENARIOS)
    ativoSalvo = localStorage.getItem(STORAGE_KEY_ATIVO)
  } catch {
    // storage indisponível
  }

  if (cenariosSalvos) {
    try {
      const parsed = JSON.parse(cenariosSalvos)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Se algum cenário não migra (versão futura, corrompido), o conteúdo
        // bruto é preservado num backup antes de cair no exemplo — nunca some.
        let houveFalha = false
        const validados = parsed.map((c) => {
          const migrado = migrarDados(c.dados)
          if (migrado) return { ...c, dados: migrado }
          houveFalha = true
          return { ...c, dados: EXEMPLO }
        })
        if (houveFalha) guardarBackup(cenariosSalvos)
        const ativoId = validados.some((c) => c.id === ativoSalvo) ? ativoSalvo : validados[0].id
        return { cenarios: validados, ativoId }
      }
    } catch {
      guardarBackup(cenariosSalvos)
    }
  }

  // Tenta migrar do formato legado (orga:dados)
  let dadosLegados = null
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_LEGADO)
    if (salvo) {
      dadosLegados = migrarDados(JSON.parse(salvo))
    }
  } catch {
    /* ignora */
  }

  const dadosIniciais = dadosLegados || EXEMPLO
  const cenarioInicial = {
    id: 'cenario-principal',
    nome: 'Organograma Principal',
    criadoEm: Date.now(),
    modificadoEm: Date.now(),
    dados: dadosIniciais,
  }

  return { cenarios: [cenarioInicial], ativoId: cenarioInicial.id }
}

export function useOrgChart() {
  const [{ cenarios, ativoId }, setEstadoCenarios] = useState(carregarCenariosInicial)
  const timerRef = useRef(null)

  // Encontra o cenário ativo atual (fallback para o primeiro)
  const cenarioAtivo = cenarios.find((c) => c.id === ativoId) || cenarios[0] || {
    id: 'cenario-principal',
    nome: 'Organograma Principal',
    dados: EXEMPLO,
  }
  const dados = cenarioAtivo.dados

  // Autosave com debounce para o conjunto de cenários
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_CENARIOS, JSON.stringify(cenarios))
        localStorage.setItem(STORAGE_KEY_ATIVO, ativoId)
        // Mantém orga:dados sincronizado com o cenário ativo para retrocompatibilidade
        localStorage.setItem(STORAGE_KEY_LEGADO, JSON.stringify(dados))
      } catch {
        // storage cheio/indisponível
      }
    }, 500)
    return () => clearTimeout(timerRef.current)
  }, [cenarios, ativoId, dados])

  // Atualizador interno dos dados do cenário ativo
  const setDados = useCallback((updater) => {
    setEstadoCenarios((prev) => {
      const idx = prev.cenarios.findIndex((c) => c.id === prev.ativoId)
      if (idx === -1) return prev
      const cenarioAtual = prev.cenarios[idx]
      const novosDados = typeof updater === 'function' ? updater(cenarioAtual.dados) : updater
      const cenariosAtualizados = [...prev.cenarios]
      cenariosAtualizados[idx] = {
        ...cenarioAtual,
        modificadoEm: Date.now(),
        dados: novosDados,
      }
      return { ...prev, cenarios: cenariosAtualizados }
    })
  }, [])

  // Operações do Organograma Ativo
  const setEmpresa = useCallback((empresa) => {
    setDados((d) => ({ ...d, empresa }))
  }, [setDados])

  const setLayoutManual = useCallback((layoutManual) => {
    setDados((d) => ({ ...d, layoutManual }))
  }, [setDados])

  const salvarPessoa = useCallback((pessoa) => {
    setDados((d) => {
      const existe = d.pessoas.some((p) => p.id === pessoa.id)
      const pessoas = existe
        ? d.pessoas.map((p) => (p.id === pessoa.id ? { ...p, ...pessoa } : p))
        : [...d.pessoas, { posicao: null, ...pessoa }]
      return { ...d, pessoas }
    })
  }, [setDados])

  const excluirPessoa = useCallback((id) => {
    setDados((d) => {
      const alvo = d.pessoas.find((p) => p.id === id)
      if (!alvo) return d
      const pessoas = d.pessoas
        .filter((p) => p.id !== id)
        .map((p) => (p.gestorId === id ? { ...p, gestorId: alvo.gestorId } : p))
      return { ...d, pessoas }
    })
  }, [setDados])

  const moverPessoa = useCallback((id, posicao) => {
    setDados((d) => ({
      ...d,
      pessoas: d.pessoas.map((p) => (p.id === id ? { ...p, posicao } : p)),
    }))
  }, [setDados])

  const reordenarPessoa = useCallback((id, direcao) => {
    setDados((d) => {
      const idx = d.pessoas.findIndex((p) => p.id === id)
      if (idx === -1) return d
      const pessoa = d.pessoas[idx]

      const irmaos = d.pessoas.filter((p) => p.gestorId === pessoa.gestorId)
      const idxNoGrupo = irmaos.findIndex((p) => p.id === id)

      let outroIrmao = null
      if (direcao === 'esquerda' && idxNoGrupo > 0) {
        outroIrmao = irmaos[idxNoGrupo - 1]
      } else if (direcao === 'direita' && idxNoGrupo < irmaos.length - 1) {
        outroIrmao = irmaos[idxNoGrupo + 1]
      }

      if (!outroIrmao) return d

      const idxOutro = d.pessoas.findIndex((p) => p.id === outroIrmao.id)
      if (idxOutro === -1) return d

      const novasPessoas = [...d.pessoas]
      novasPessoas[idx] = outroIrmao
      novasPessoas[idxOutro] = pessoa
      return { ...d, pessoas: novasPessoas }
    })
  }, [setDados])

  const alterarNivelBloco = useCallback((id, direcao) => {
    setDados((d) => {
      const idx = d.pessoas.findIndex((p) => p.id === id)
      if (idx === -1) return d
      const p = d.pessoas[idx]

      let novoNivel = p.nivel
      if (direcao === 'subir') {
        novoNivel = Math.max(1, p.nivel - 1)
      } else if (direcao === 'descer') {
        novoNivel = p.nivel + 1
      }

      if (novoNivel === p.nivel) return d

      if (p.gestorId) {
        const gestor = d.pessoas.find((g) => g.id === p.gestorId)
        if (gestor && gestor.nivel >= novoNivel) return d
      }

      const subordinados = d.pessoas.filter((s) => s.gestorId === p.id)
      const minSubNivel = subordinados.reduce((m, s) => Math.min(m, s.nivel), Infinity)
      if (novoNivel >= minSubNivel) return d

      const novasPessoas = d.pessoas.map((x) =>
        x.id === id ? { ...x, nivel: novoNivel } : x
      )
      return { ...d, pessoas: novasPessoas }
    })
  }, [setDados])

  const alterarNivelEquipe = useCallback((id, direcao) => {
    setDados((d) => {
      const idx = d.pessoas.findIndex((p) => p.id === id)
      if (idx === -1) return d
      const p = d.pessoas[idx]

      const descendentesIds = comDescendentes([id], d.pessoas)
      let delta = direcao === 'subir' ? -1 : direcao === 'descer' ? 1 : 0
      if (delta === 0) return d

      for (const pid of descendentesIds) {
        const x = d.pessoas.find((x) => x.id === pid)
        if (x && x.nivel + delta < 1) return d
      }

      if (p.gestorId) {
        const gestor = d.pessoas.find((g) => g.id === p.gestorId)
        if (gestor && gestor.nivel >= p.nivel + delta) return d
      }

      const novasPessoas = d.pessoas.map((x) => {
        if (descendentesIds.has(x.id)) {
          return { ...x, nivel: x.nivel + delta }
        }
        return x
      })

      return { ...d, pessoas: novasPessoas }
    })
  }, [setDados])

  const limparPosicoes = useCallback(() => {
    setDados((d) => ({
      ...d,
      layoutManual: false,
      pessoas: d.pessoas.map((p) => ({ ...p, posicao: null })),
    }))
  }, [setDados])

  const salvarEmpresa = useCallback((empresa) => {
    setDados((d) => {
      const empresas = d.empresas ?? []
      const existe = empresa.id && empresas.some((e) => e.id === empresa.id)
      return {
        ...d,
        empresas: existe
          ? empresas.map((e) => (e.id === empresa.id ? { ...e, ...empresa } : e))
          : [...empresas, { ...empresa, id: empresa.id || novoId() }],
      }
    })
  }, [setDados])

  const excluirEmpresa = useCallback((id) => {
    setDados((d) => ({
      ...d,
      empresas: (d.empresas ?? []).filter((e) => e.id !== id),
      pessoas: d.pessoas.map((p) => ({
        ...p,
        empresaIds: (p.empresaIds ?? []).filter((eid) => eid !== id),
      })),
    }))
  }, [setDados])

  const reordenarEmpresas = useCallback((novasEmpresas) => {
    setDados((d) => ({
      ...d,
      empresas: novasEmpresas,
    }))
  }, [setDados])

  const substituirDados = useCallback((importado) => {
    // Pacote completo (backup com vários cenários): restaura o workspace inteiro.
    if (importado?.tipo === 'pacote' && Array.isArray(importado.cenarios)) {
      setEstadoCenarios({
        cenarios: importado.cenarios,
        ativoId: importado.ativoId || importado.cenarios[0].id,
      })
      return
    }
    // Organograma único: ADICIONA como novo cenário, sem apagar os existentes.
    if (importado?.tipo === 'unico' && importado.cenarios?.[0]) {
      const novo = importado.cenarios[0]
      setEstadoCenarios((prev) => ({
        cenarios: [...prev.cenarios, novo],
        ativoId: novo.id,
      }))
      return
    }
    // Fallbacks (compatibilidade): objeto de dados cru.
    if (importado?.dados) setDados(importado.dados)
    else setDados(importado)
  }, [setDados])

  // --- Gerenciamento de Cenários ---
  const selecionarCenario = useCallback((id) => {
    setEstadoCenarios((prev) => {
      if (!prev.cenarios.some((c) => c.id === id)) return prev
      return { ...prev, ativoId: id }
    })
  }, [])

  const criarCenario = useCallback(({ nome, modeloId = null, incluirPessoasIds = null }) => {
    const idCenario = novoIdCenario()

    setEstadoCenarios((prev) => {
      const modelo = modeloId ? prev.cenarios.find((c) => c.id === modeloId) : null
      let dadosNovos

      if (modelo) {
        if (incluirPessoasIds && Array.isArray(incluirPessoasIds) && incluirPessoasIds.length > 0) {
          const pessoasClonadas = clonarPessoas(incluirPessoasIds, modelo.dados.pessoas)
          dadosNovos = {
            ...JSON.parse(JSON.stringify(modelo.dados)),
            pessoas: pessoasClonadas,
          }
        } else {
          dadosNovos = JSON.parse(JSON.stringify(modelo.dados))
        }
      } else {
        // Criar organograma do zero
        dadosNovos = {
          empresa: 'Minha Empresa',
          pessoas: [
            {
              id: novoId(),
              nome: 'Líder / Diretor',
              cargo: 'Presidente / CEO',
              nivel: 1,
              gestorId: null,
              ehGestor: true,
              area: 'Diretoria',
              setor: 'Executivo',
              empresaIds: [],
              vagaAberta: false,
              posicao: null,
            },
          ],
          empresas: [],
          layoutManual: false,
          version: CURRENT_VERSION,
        }
      }

      const novoCenario = {
        id: idCenario,
        nome: nome?.trim() || 'Novo Organograma',
        criadoEm: Date.now(),
        modificadoEm: Date.now(),
        dados: dadosNovos,
      }

      return {
        cenarios: [...prev.cenarios, novoCenario],
        ativoId: idCenario,
      }
    })
  }, [])

  const duplicarCenario = useCallback((id, nomeOpcional) => {
    setEstadoCenarios((prev) => {
      const alvo = prev.cenarios.find((c) => c.id === id)
      if (!alvo) return prev
      const idCenario = novoIdCenario()
      const novoNome = nomeOpcional || `${alvo.nome} (Cópia)`
      const novoCenario = {
        id: idCenario,
        nome: novoNome,
        criadoEm: Date.now(),
        modificadoEm: Date.now(),
        dados: JSON.parse(JSON.stringify(alvo.dados)),
      }
      return {
        cenarios: [...prev.cenarios, novoCenario],
        ativoId: idCenario,
      }
    })
  }, [])

  const renomearCenario = useCallback((id, novoNome) => {
    if (!novoNome?.trim()) return
    const nomeLimpo = novoNome.trim()
    setEstadoCenarios((prev) => ({
      ...prev,
      cenarios: prev.cenarios.map((c) =>
        c.id === id
          ? {
              ...c,
              nome: nomeLimpo,
              modificadoEm: Date.now(),
            }
          : c
      ),
    }))
  }, [])

  const excluirCenario = useCallback((id) => {
    setEstadoCenarios((prev) => {
      if (prev.cenarios.length <= 1) return prev
      const alvo = prev.cenarios.find((c) => c.id === id)
      if (!alvo) return prev
      // Excluir um organograma inteiro é destrutivo e sem desfazer: preserva
      // uma cópia recuperável antes de remover.
      guardarBackup(JSON.stringify(alvo))
      const cenariosFiltrados = prev.cenarios.filter((c) => c.id !== id)
      const novoAtivoId = prev.ativoId === id ? cenariosFiltrados[0].id : prev.ativoId
      return {
        cenarios: cenariosFiltrados,
        ativoId: novoAtivoId,
      }
    })
  }, [])

  const copiarPessoasParaCenario = useCallback(
    ({ cenarioDestinoId, pessoaId, incluirDescendentes = true }) => {
      setEstadoCenarios((prev) => {
        const cenarioOrigem = prev.cenarios.find((c) => c.id === prev.ativoId)
        const idxDestino = prev.cenarios.findIndex((c) => c.id === cenarioDestinoId)
        if (!cenarioOrigem || idxDestino === -1) return prev

        const idsParaCopiar = incluirDescendentes
          ? Array.from(comDescendentes([pessoaId], cenarioOrigem.dados.pessoas))
          : [pessoaId]

        const clonadas = clonarPessoas(idsParaCopiar, cenarioOrigem.dados.pessoas)
        const cenarioDestino = prev.cenarios[idxDestino]
        const pessoasAtuaisDestino = cenarioDestino.dados.pessoas || []
        const novasPessoas = [...pessoasAtuaisDestino, ...clonadas]

        const cenariosAtualizados = [...prev.cenarios]
        // normalizarEmpresas descarta os empresaIds vindos da origem que não
        // existem no registro do destino — sem isso os clonados sumiriam de
        // qualquer filtro de empresa no destino.
        cenariosAtualizados[idxDestino] = {
          ...cenarioDestino,
          modificadoEm: Date.now(),
          dados: normalizarEmpresas({
            ...cenarioDestino.dados,
            pessoas: normalizarGestores(novasPessoas),
          }),
        }

        return { ...prev, cenarios: cenariosAtualizados }
      })
    },
    []
  )

  return {
    dados,
    cenarios,
    cenarioAtivoId: ativoId,
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
  }
}
