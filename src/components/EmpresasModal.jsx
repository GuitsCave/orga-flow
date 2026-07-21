import { useState } from 'react'
import { Building2, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { CORES_EMPRESA, COR_EMPRESA_PADRAO } from '../lib/modelo.js'

/** Paleta de cores clicável usada na criação e na edição. */
function SeletorCor({ valor, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CORES_EMPRESA.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
            valor === c ? 'ring-2 ring-slate-900 ring-offset-2' : ''
          }`}
          style={{ backgroundColor: c }}
          title={`Cor ${c}`}
          aria-label={`Escolher cor ${c}`}
        />
      ))}
    </div>
  )
}

/**
 * Cadastro de empresas do grupo: adicionar, renomear, trocar a cor e excluir.
 * `pessoas` é usado só para avisar quantos cargos usam a empresa antes de excluir.
 */
export default function EmpresasModal({ empresas, pessoas, onSalvar, onExcluir, onFechar }) {
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(COR_EMPRESA_PADRAO)
  const [editandoId, setEditandoId] = useState(null)
  const [rascunho, setRascunho] = useState({ nome: '', cor: COR_EMPRESA_PADRAO })
  const [confirmarExclusao, setConfirmarExclusao] = useState(null)

  const usoDaEmpresa = (id) => pessoas.filter((p) => (p.empresaIds ?? []).includes(id)).length

  function adicionar(e) {
    e.preventDefault()
    if (!nome.trim()) return
    onSalvar({ nome: nome.trim(), cor })
    setNome('')
    setCor(COR_EMPRESA_PADRAO)
  }

  function confirmarEdicao(id) {
    if (!rascunho.nome.trim()) return
    onSalvar({ id, nome: rascunho.nome.trim(), cor: rascunho.cor })
    setEditandoId(null)
  }

  const campo =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Building2 size={18} /> Empresas do grupo
          </h2>
          <button
            onClick={onFechar}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {empresas.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
              Nenhuma empresa cadastrada ainda. Adicione a primeira abaixo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {empresas.map((e) => {
                const emUso = usoDaEmpresa(e.id)
                return (
                  <li key={e.id} className="rounded-lg border border-slate-200 px-3 py-2">
                    {editandoId === e.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          className={campo}
                          value={rascunho.nome}
                          onChange={(ev) => setRascunho((r) => ({ ...r, nome: ev.target.value }))}
                          autoFocus
                        />
                        <SeletorCor
                          valor={rascunho.cor}
                          onChange={(c) => setRascunho((r) => ({ ...r, cor: c }))}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditandoId(null)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => confirmarEdicao(e.id)}
                            className="flex items-center gap-1 rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            <Check size={14} /> Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: e.cor }}
                          aria-hidden
                        />
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {e.nome}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                          {emUso} cargo(s)
                        </span>
                        <button
                          onClick={() => {
                            setEditandoId(e.id)
                            setRascunho({ nome: e.nome, cor: e.cor })
                            setConfirmarExclusao(null)
                          }}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label={`Editar ${e.nome}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmarExclusao(e.id)}
                          className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Excluir ${e.nome}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}

                    {confirmarExclusao === e.id && (
                      <div className="mt-2 rounded-lg bg-red-50 px-3 py-2">
                        <p className="text-xs font-medium text-red-700">
                          Excluir “{e.nome}”?
                          {emUso > 0
                            ? ` O vínculo será removido de ${emUso} cargo(s).`
                            : ' Nenhum cargo usa esta empresa.'}
                        </p>
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => setConfirmarExclusao(null)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              onExcluir(e.id)
                              setConfirmarExclusao(null)
                            }}
                            className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <form onSubmit={adicionar} className="flex flex-col gap-2 border-t border-slate-200 p-4">
          <label className="text-xs font-semibold text-slate-600" htmlFor="nova-empresa">
            Nova empresa
          </label>
          <div className="flex gap-2">
            <input
              id="nova-empresa"
              className={campo}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Nome da Empresa"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus size={16} /> Adicionar
            </button>
          </div>
          <SeletorCor valor={cor} onChange={setCor} />
        </form>
      </div>
    </div>
  )
}
