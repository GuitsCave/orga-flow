import { useEffect, useState } from 'react'
import { Save, Trash2, X } from 'lucide-react'
import { novoId } from '../hooks/useOrgChart.js'
import MultiSelect from './MultiSelect.jsx'

const MAX_LINHAS_DESC = 5

const VAZIO = {
  nome: '',
  cargo: '',
  nivel: 1,
  area: '',
  setor: '',
  descricao: '',
  gestorId: '',
  ehGestor: false,
  vagaAberta: false,
  empresaIds: [],
}

/**
 * Painel lateral de criar/editar pessoa.
 * pessoa=null → criação; pessoa preenchida → edição.
 */
export default function PessoaForm({
  pessoa,
  gestorInicial,
  pessoas,
  empresas = [],
  onSalvar,
  onExcluir,
  onFechar,
  onReordenar,
}) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setErro('')
    if (pessoa) {
      setForm({
        nome: pessoa.nome,
        cargo: pessoa.cargo,
        nivel: pessoa.nivel,
        area: pessoa.area || '',
        setor: pessoa.setor || '',
        descricao: pessoa.descricao || '',
        gestorId: pessoa.gestorId || '',
        ehGestor: pessoa.ehGestor === true,
        vagaAberta: pessoa.vagaAberta === true,
        empresaIds: pessoa.empresaIds ?? [],
      })
    } else {
      // Criando via "+" de um gestor: já entra um nível abaixo dele
      const gestor = gestorInicial ? pessoas.find((p) => p.id === gestorInicial) : null
      setForm({
        ...VAZIO,
        gestorId: gestorInicial || '',
        nivel: gestor ? gestor.nivel + 1 : VAZIO.nivel,
      })
    }
  }, [pessoa?.id, gestorInicial])

  const editar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  // Limita a descrição a no máximo 5 linhas
  const editarDescricao = (e) => {
    const limitado = e.target.value.split('\n').slice(0, MAX_LINHAS_DESC).join('\n')
    setForm((f) => ({ ...f, descricao: limitado }))
  }

  // Impede escolher como gestor a própria pessoa ou alguém abaixo dela na hierarquia
  const descendentes = new Set()
  if (pessoa) {
    const fila = [pessoa.id]
    while (fila.length) {
      const atual = fila.pop()
      descendentes.add(atual)
      for (const p of pessoas) {
        if (p.gestorId === atual && !descendentes.has(p.id)) fila.push(p.id)
      }
    }
  }
  // Subordinados diretos desta pessoa (para validações de gestão e nível)
  const subordinados = pessoa ? pessoas.filter((p) => p.gestorId === pessoa.id) : []
  const nivelMinSubordinado = subordinados.reduce((m, p) => Math.min(m, p.nivel), Infinity)

  // Só quem tem a flag de gestor entra na lista; o gestor atual permanece
  // visível mesmo que a flag dele tenha sido desativada depois.
  const gestoresPossiveis = pessoas.filter(
    (p) => !descendentes.has(p.id) && (p.ehGestor || p.id === form.gestorId),
  )

  const rotuloPessoa = (p) => p.nome || `Vaga em aberto (${p.cargo})`

  function enviar(e) {
    e.preventDefault()
    if (!form.vagaAberta && !form.nome.trim()) return setErro('Informe o nome.')
    if (!form.cargo.trim()) return setErro('Informe o cargo.')
    const nivel = Number(form.nivel)
    if (!Number.isInteger(nivel) || nivel < 1) return setErro('Nível deve ser 1 ou maior.')

    // Gestão: quem tem subordinados não pode deixar de ser gestor
    if (subordinados.length && !form.ehGestor) {
      return setErro(
        `Não dá para desmarcar "É gestor(a)": há ${subordinados.length} subordinado(s) vinculado(s). ` +
          `Reatribua-os a outro gestor primeiro.`,
      )
    }
    // Nível: o gestor precisa estar acima (número menor que o desta posição)
    if (form.gestorId) {
      const gestor = pessoas.find((p) => p.id === form.gestorId)
      if (gestor && gestor.nivel >= nivel) {
        return setErro(
          `O gestor ${rotuloPessoa(gestor)} é nível ${gestor.nivel}. ` +
            `Esta posição precisa ficar abaixo dele — use um nível maior que ${gestor.nivel}.`,
        )
      }
    }
    // Nível: esta pessoa precisa ficar acima dos próprios subordinados
    if (subordinados.length && nivel >= nivelMinSubordinado) {
      return setErro(
        `Há subordinado(s) no nível ${nivelMinSubordinado}. ` +
          `O nível desta pessoa precisa ser menor que ${nivelMinSubordinado}.`,
      )
    }

    onSalvar({
      id: pessoa ? pessoa.id : novoId(),
      nome: form.vagaAberta ? '' : form.nome.trim(),
      cargo: form.cargo.trim(),
      nivel,
      area: form.area.trim(),
      setor: form.setor.trim(),
      descricao: form.descricao.trim(),
      gestorId: form.gestorId || null,
      ehGestor: form.ehGestor || subordinados.length > 0,
      vagaAberta: form.vagaAberta,
      empresaIds: form.empresaIds,
      ...(pessoa ? { posicao: pessoa.posicao } : {}),
    })
    onFechar()
  }

  const campo =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
  const rotulo = 'mb-1 block text-xs font-semibold text-slate-600'

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {pessoa ? 'Editar pessoa' : 'Nova pessoa'}
        </h2>
        <button
          onClick={onFechar}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Fechar painel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Só os campos rolam; as ações ficam num rodapé sempre visível */}
      <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <label
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
          title="A posição existe no organograma, mas ainda não tem titular"
        >
          <input
            type="checkbox"
            checked={form.vagaAberta}
            onChange={(e) => setForm((f) => ({ ...f, vagaAberta: e.target.checked }))}
            className="h-4 w-4 shrink-0 accent-brand-600"
          />
          <span className="whitespace-nowrap text-sm font-medium text-slate-700">
            Vaga em aberto
          </span>
          <span className="ml-auto truncate text-[11px] text-slate-400">Sem titular</span>
        </label>
        <div>
          <label className={rotulo} htmlFor="f-nome">
            {form.vagaAberta ? 'Nome' : 'Nome *'}
          </label>
          <input
            id="f-nome"
            className={`${campo} disabled:bg-slate-100 disabled:text-slate-400`}
            value={form.vagaAberta ? '' : form.nome}
            onChange={editar('nome')}
            disabled={form.vagaAberta}
            placeholder={form.vagaAberta ? 'Vaga em aberto (sem titular)' : 'Ex.: Maria Silva'}
          />
        </div>
        <div>
          <label className={rotulo} htmlFor="f-cargo">Cargo *</label>
          <input id="f-cargo" className={campo} value={form.cargo} onChange={editar('cargo')} placeholder="Ex.: Gerente de RH" />
        </div>
        {/* Gestor ocupa 2/3: o nome do gestor é bem mais longo que o número do nível */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={rotulo} htmlFor="f-nivel">Nível *</label>
            <input
              id="f-nivel"
              type="number"
              min="1"
              className={campo}
              value={form.nivel}
              onChange={editar('nivel')}
              title="1 = topo da hierarquia. O número não aparece no bloco."
            />
            <p className="mt-1 text-[11px] text-slate-400">1 = topo</p>
          </div>
          <div className="col-span-2">
            <label className={rotulo} htmlFor="f-gestor">Gestor</label>
            <select id="f-gestor" className={campo} value={form.gestorId} onChange={editar('gestorId')}>
              <option value="">— Nenhum (topo) —</option>
              {gestoresPossiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome || `Vaga em aberto (${p.cargo})`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label
          className={`flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 ${
            subordinados.length ? 'cursor-not-allowed bg-slate-50' : 'cursor-pointer'
          }`}
          title={
            subordinados.length
              ? `Não pode ser desmarcado: tem ${subordinados.length} subordinado(s) vinculado(s)`
              : 'Marque para esta pessoa aparecer na lista de gestores'
          }
        >
          <input
            type="checkbox"
            checked={form.ehGestor || subordinados.length > 0}
            onChange={(e) => setForm((f) => ({ ...f, ehGestor: e.target.checked }))}
            disabled={subordinados.length > 0}
            className="h-4 w-4 shrink-0 accent-brand-600"
          />
          <span className="whitespace-nowrap text-sm font-medium text-slate-700">É gestor(a)?</span>
          {subordinados.length > 0 && (
            <span className="ml-auto whitespace-nowrap text-[11px] text-slate-400">
              {subordinados.length} subordinado{subordinados.length > 1 ? 's' : ''}
            </span>
          )}
        </label>
        <div>
          <label className={rotulo} htmlFor="f-area">Área</label>
          <input id="f-area" className={campo} value={form.area} onChange={editar('area')} placeholder="Ex.: Operações" />
        </div>
        <div>
          <label className={rotulo} htmlFor="f-setor">Setor</label>
          <input id="f-setor" className={campo} value={form.setor} onChange={editar('setor')} placeholder="Ex.: Logística" />
        </div>

        {empresas.length > 0 && (
          <div>
            <span className={rotulo}>Empresas</span>
            <MultiSelect
              full
              permitirTodas
              opcoes={empresas.map((e) => e.id)}
              valoresSelecionados={form.empresaIds}
              onChange={(ids) => setForm((f) => ({ ...f, empresaIds: ids }))}
              formatar={(id) => empresas.find((e) => e.id === id)?.nome ?? id}
              corDe={(id) => empresas.find((e) => e.id === id)?.cor}
              titulo="Empresas do cargo"
              rotuloVazio="Nenhuma selecionada"
            />
            {form.empresaIds.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-400">
                Sem empresa definida — o cargo herda a empresa do gestor.
              </p>
            )}
          </div>
        )}

        <div>
          <label className={rotulo} htmlFor="f-desc">Descrição (máximo de 5 linhas)</label>
          <textarea
            id="f-desc"
            rows={5}
            className={campo}
            value={form.descricao}
            onChange={editarDescricao}
            placeholder="Breve descrição (opcional)"
          />
        </div>

        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white p-4">
          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {erro}
            </p>
          )}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <Save size={16} />
            {pessoa ? 'Salvar alterações' : 'Adicionar pessoa'}
          </button>
          {pessoa && (
            <button
              type="button"
              onClick={() => {
                onExcluir(pessoa.id)
                onFechar()
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Excluir pessoa
            </button>
          )}
        </div>
      </form>
    </aside>
  )
}
