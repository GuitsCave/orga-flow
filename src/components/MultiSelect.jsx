import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

/** Ignora acentos e maiúsculas para a busca ("logistica" acha "Logística") */
const normalizar = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Seleção múltipla em dropdown, usada tanto nos filtros da toolbar quanto no
 * cadastro da pessoa. Mantém a lista fechada para não empurrar o conteúdo.
 *
 * `corDe` (opcional) devolve uma cor por opção e desenha a bolinha ao lado.
 * `full` deixa o botão com a largura toda (uso em formulário).
 */
export default function MultiSelect({
  opcoes,
  valoresSelecionados,
  onChange,
  formatar = (v) => v,
  corDe,
  titulo,
  rotuloVazio,
  icone,
  prefixo,
  full = false,
  permitirTodas = false,
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const containerRef = useRef(null)
  const buscaRef = useRef(null)

  const fechar = () => {
    setAberto(false)
    setBusca('')
  }

  useEffect(() => {
    function aoClicarFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAberto(false)
        setBusca('')
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  // Foca o campo de busca assim que o dropdown abre
  useEffect(() => {
    if (aberto) buscaRef.current?.focus()
  }, [aberto])

  const opcoesFiltradas = busca.trim()
    ? opcoes.filter((o) => normalizar(formatar(o)).includes(normalizar(busca)))
    : opcoes

  const toggleOpcao = (opcao) =>
    onChange(
      valoresSelecionados.includes(opcao)
        ? valoresSelecionados.filter((v) => v !== opcao)
        : [...valoresSelecionados, opcao],
    )

  const texto =
    valoresSelecionados.length === 0
      ? rotuloVazio
      : valoresSelecionados.length === 1
      ? formatar(valoresSelecionados[0])
      : `${valoresSelecionados.length} sel.`

  return (
    <div ref={containerRef} className={`relative z-20 ${full ? 'w-full' : ''}`}>
      <button
        type="button"
        onClick={() => (aberto ? fechar() : setAberto(true))}
        title={titulo}
        className={
          full
            ? 'flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm text-slate-900 hover:border-slate-400'
            : `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                // filtro ativo ganha destaque para não passar despercebido
                valoresSelecionados.length > 0
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`
        }
      >
        {icone}
        {prefixo && <span className="hidden sm:inline">{prefixo}:</span>}
        <span className={full ? 'truncate' : 'font-bold'}>{texto}</span>
        <ChevronDown
          size={14}
          className={`${full ? 'ml-auto shrink-0' : ''} transition-transform ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {aberto && (
        <div
          className={`absolute z-30 mt-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg ${
            full ? 'left-0 right-0' : 'right-0 w-56'
          }`}
        >
          <div className="mb-1.5 flex items-center justify-between border-b border-slate-100 px-1 pb-1.5">
            <span className="text-xs font-bold text-slate-400">{titulo}</span>
            <div className="flex gap-2 text-xs font-semibold">
              {permitirTodas &&
                opcoesFiltradas.some((o) => !valoresSelecionados.includes(o)) && (
                  <button
                    type="button"
                    // Com busca ativa, marca só o que está visível
                    onClick={() =>
                      onChange([...new Set([...valoresSelecionados, ...opcoesFiltradas])])
                    }
                    className="text-brand-600 hover:underline"
                  >
                    Todas
                  </button>
                )}
              {valoresSelecionados.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-slate-400 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
          <div className="relative mb-1.5">
            <Search
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={buscaRef}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && fechar()}
              placeholder="Buscar..."
              className="w-full rounded-md border border-slate-200 py-1 pl-7 pr-2 text-sm text-slate-900 outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {opcoesFiltradas.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-slate-400">
                Nenhum resultado para “{busca}”.
              </p>
            )}
            {opcoesFiltradas.map((opcao) => {
              const cor = corDe?.(opcao)
              return (
                <label
                  key={opcao}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={valoresSelecionados.includes(opcao)}
                    onChange={() => toggleOpcao(opcao)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  {cor && (
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: cor }}
                      aria-hidden
                    />
                  )}
                  <span className="truncate">{formatar(opcao)}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
