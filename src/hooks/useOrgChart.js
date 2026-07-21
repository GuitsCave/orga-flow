import { useCallback, useEffect, useRef, useState } from 'react'
import { EXEMPLO } from '../data/exemplo.js'
import { migrarDados, comDescendentes } from '../lib/modelo.js'

const STORAGE_KEY = 'orga:dados'
const PREFIXO_BACKUP = 'orga:backup:'

/**
 * Guarda o conteúdo bruto que não pôde ser aberto, para o usuário poder recuperar.
 * REGRA: nada do que o usuário produziu é apagado, em nenhuma hipótese.
 */
function guardarBackup(conteudo) {
  try {
    // Não empilha cópias idênticas (o StrictMode monta duas vezes em dev)
    const jaExiste = listarBackups().some((k) => localStorage.getItem(k) === conteudo)
    if (jaExiste) return
    localStorage.setItem(`${PREFIXO_BACKUP}${Date.now()}`, conteudo)
  } catch {
    // storage cheio: sem espaço para o backup, então preserva o original
  }
}

/**
 * Guarda o organograma atual antes de uma ação que o substitui por inteiro
 * (importação). Mantém a regra de nunca destruir o que o usuário produziu.
 * Devolve true se havia algo para preservar.
 */
export function guardarBackupDoAtual() {
  try {
    const atual = localStorage.getItem(STORAGE_KEY)
    if (!atual) return false
    guardarBackup(atual)
    return true
  } catch {
    return false
  }
}

/** Chaves de backup existentes, da mais recente para a mais antiga */
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

function carregarInicial() {
  let salvo = null
  try {
    salvo = localStorage.getItem(STORAGE_KEY)
  } catch {
    return EXEMPLO // storage indisponível (modo privado, permissão negada)
  }
  if (!salvo) return EXEMPLO

  try {
    const migrado = migrarDados(JSON.parse(salvo))
    if (migrado) return migrado
  } catch {
    // JSON corrompido — cai no backup abaixo
  }

  // Não deu para abrir: preserva o conteúdo original em vez de descartar
  guardarBackup(salvo)
  return EXEMPLO
}

export function novoId() {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function useOrgChart() {
  const [dados, setDados] = useState(carregarInicial)
  const timerRef = useRef(null)

  // Autosave com debounce
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados))
      } catch {
        // storage cheio/indisponível — export manual continua funcionando
      }
    }, 500)
    return () => clearTimeout(timerRef.current)
  }, [dados])

  const setEmpresa = useCallback((empresa) => {
    setDados((d) => ({ ...d, empresa }))
  }, [])

  const setLayoutManual = useCallback((layoutManual) => {
    setDados((d) => ({ ...d, layoutManual }))
  }, [])

  const salvarPessoa = useCallback((pessoa) => {
    setDados((d) => {
      const existe = d.pessoas.some((p) => p.id === pessoa.id)
      const pessoas = existe
        ? d.pessoas.map((p) => (p.id === pessoa.id ? { ...p, ...pessoa } : p))
        : [...d.pessoas, { posicao: null, ...pessoa }]
      return { ...d, pessoas }
    })
  }, [])

  // Ao excluir, subordinados são reatados ao gestor da pessoa excluída
  const excluirPessoa = useCallback((id) => {
    setDados((d) => {
      const alvo = d.pessoas.find((p) => p.id === id)
      if (!alvo) return d
      const pessoas = d.pessoas
        .filter((p) => p.id !== id)
        .map((p) => (p.gestorId === id ? { ...p, gestorId: alvo.gestorId } : p))
      return { ...d, pessoas }
    })
  }, [])

  const moverPessoa = useCallback((id, posicao) => {
    setDados((d) => ({
      ...d,
      pessoas: d.pessoas.map((p) => (p.id === id ? { ...p, posicao } : p)),
    }))
  }, [])

  const reordenarPessoa = useCallback((id, direcao) => {
    setDados((d) => {
      const idx = d.pessoas.findIndex((p) => p.id === id)
      if (idx === -1) return d
      const pessoa = d.pessoas[idx]

      // Encontrar todos os irmãos (mesmo gestorId) no array completo de pessoas
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
  }, [])

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

      // Validar se novoNivel respeita o gestor
      if (p.gestorId) {
        const gestor = d.pessoas.find((g) => g.id === p.gestorId)
        if (gestor && gestor.nivel >= novoNivel) return d
      }

      // Validar se novoNivel respeita os subordinados directos
      const subordinados = d.pessoas.filter((s) => s.gestorId === p.id)
      const minSubNivel = subordinados.reduce((m, s) => Math.min(m, s.nivel), Infinity)
      if (novoNivel >= minSubNivel) return d

      const novasPessoas = d.pessoas.map((x) =>
        x.id === id ? { ...x, nivel: novoNivel } : x
      )
      return { ...d, pessoas: novasPessoas }
    })
  }, [])

  const alterarNivelEquipe = useCallback((id, direcao) => {
    setDados((d) => {
      const idx = d.pessoas.findIndex((p) => p.id === id)
      if (idx === -1) return d
      const p = d.pessoas[idx]

      const descendentesIds = comDescendentes([id], d.pessoas)
      
      let delta = 0
      if (direcao === 'subir') {
        delta = -1
      } else if (direcao === 'descer') {
        delta = 1
      }

      if (delta === 0) return d

      // Validar se todos continuam com nivel >= 1
      for (const pid of descendentesIds) {
        const x = d.pessoas.find((x) => x.id === pid)
        if (x && x.nivel + delta < 1) return d
      }

      // Validar o gestor do nó líder da equipe
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
  }, [])

  const limparPosicoes = useCallback(() => {
    setDados((d) => ({
      ...d,
      layoutManual: false,
      pessoas: d.pessoas.map((p) => ({ ...p, posicao: null })),
    }))
  }, [])

  // Cria (sem id) ou atualiza uma empresa do cadastro
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
  }, [])

  // Ao excluir, o vínculo é removido de todas as pessoas
  const excluirEmpresa = useCallback((id) => {
    setDados((d) => ({
      ...d,
      empresas: (d.empresas ?? []).filter((e) => e.id !== id),
      pessoas: d.pessoas.map((p) => ({
        ...p,
        empresaIds: (p.empresaIds ?? []).filter((eid) => eid !== id),
      })),
    }))
  }, [])

  const substituirDados = useCallback((novos) => {
    setDados(novos)
  }, [])

  return {
    dados,
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
    substituirDados,
  }
}
