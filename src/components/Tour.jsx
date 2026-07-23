import { useEffect, useLayoutEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'

const RECUO = 8 // folga entre o elemento e o recorte iluminado
const LARGURA_CARD = 320

/**
 * Passos do tour. `alvo` é o valor do atributo data-tour do elemento a destacar;
 * sem `alvo`, o passo aparece centralizado (usado na abertura e no encerramento).
 * Passos cujo alvo não existe na tela são pulados automaticamente.
 */
export const PASSOS = [
  {
    titulo: 'Bem-vindo ao Orga',
    texto:
      'Aqui você monta o organograma da sua empresa. Um tour rápido mostrando o essencial. Você pode sair quando quiser e reabrir depois pelo menu “☰”.',
  },
  {
    alvo: 'grupo',
    titulo: 'Nome do grupo',
    texto: 'Clique aqui para dar nome ao seu grupo ou empresa. Ele é salvo sozinho.',
  },
  {
    alvo: 'adicionar',
    titulo: 'Cadastrar um cargo',
    texto:
      'Abre o painel lateral para criar um cargo: nome, cargo, nível, área, setor e gestor. Se a posição ainda não tem titular, marque “Vaga em aberto”.',
  },
  {
    alvo: 'canvas',
    titulo: 'O organograma',
    texto:
      'Clique em um bloco para editá-lo. Ao passar o mouse sobre um gestor, aparece um botão “+” embaixo dele que já cria um subordinado com o gestor e o nível preenchidos.',
  },
  {
    alvo: 'filtros',
    titulo: 'Filtros',
    texto:
      'Filtre por empresa, gestor, área, setor ou nível. Filtrar por um gestor mostra a árvore inteira abaixo dele. Os filtros só mudam o que você vê — nada é apagado.',
  },
  {
    alvo: 'menu',
    titulo: 'Menu e configurações',
    texto:
      'Aqui ficam o cadastro de empresas (cada uma com sua cor), o backup dos dados (exportar/importar JSON), o layout automático ou manual e este passo a passo. Tudo é salvo apenas neste navegador — exporte de tempos em tempos.',
  },
  {
    titulo: 'Tudo pronto!',
    texto:
      'É só começar a cadastrar. Se precisar rever este passo a passo, clique no botão “?” no topo da tela.',
  },
]

/** Calcula a posição do card em relação ao elemento destacado */
function posicionarCard(area) {
  if (!area) {
    return {
      top: window.innerHeight / 2 - 120,
      left: window.innerWidth / 2 - LARGURA_CARD / 2,
    }
  }
  const abaixo = area.bottom + RECUO + 12
  const cabeAbaixo = abaixo + 200 < window.innerHeight
  const top = cabeAbaixo ? abaixo : Math.max(12, area.top - RECUO - 212)
  // Centraliza no alvo, mas sem deixar o card escapar da tela
  const left = Math.min(
    Math.max(12, area.left + area.width / 2 - LARGURA_CARD / 2),
    window.innerWidth - LARGURA_CARD - 12,
  )
  return { top, left }
}

export default function Tour({ onFechar }) {
  const [indice, setIndice] = useState(0)
  // Direção da navegação, para o auto-pulo de passos sem alvo seguir o usuário
  const [sentido, setSentido] = useState('frente')

  const avancar = () => {
    setSentido('frente')
    setIndice((i) => Math.min(i + 1, PASSOS.length - 1))
  }
  const voltar = () => {
    setSentido('tras')
    setIndice((i) => Math.max(i - 1, 0))
  }
  const [area, setArea] = useState(null)

  const passo = PASSOS[indice]

  // Mede o elemento do passo atual (e remede em resize)
  useLayoutEffect(() => {
    function medir() {
      if (!passo.alvo) return setArea(null)
      const el = document.querySelector(`[data-tour="${passo.alvo}"]`)
      if (!el) return setArea(null)
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      setArea(el.getBoundingClientRect())
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [passo])

  // Pula passos cujo alvo não existe nesta tela (ex.: filtro ainda sem opções).
  // Pula no sentido em que o usuário está navegando: avançar sempre empurraria
  // para frente e tornaria os passos anteriores inalcançáveis pelo "Voltar".
  useEffect(() => {
    if (!passo.alvo || document.querySelector(`[data-tour="${passo.alvo}"]`)) return
    if (sentido === 'tras') {
      if (indice > 0) setIndice((i) => i - 1)
      else setSentido('frente') // já no início: segue para frente
    } else if (indice < PASSOS.length - 1) {
      setIndice((i) => i + 1)
    }
  }, [passo, indice, sentido])

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape') onFechar()
      if (e.key === 'ArrowRight' && indice < PASSOS.length - 1) avancar()
      if (e.key === 'ArrowLeft' && indice > 0) voltar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [indice, onFechar])

  const ultimo = indice === PASSOS.length - 1
  const { top, left } = posicionarCard(area)

  return (
    <>
      {/* Bloqueia a interação com o app enquanto o tour está aberto */}
      <div className="fixed inset-0 z-[60]" />

      {/* Recorte iluminado: a sombra gigante escurece todo o resto da tela */}
      <div
        className="pointer-events-none fixed z-[61] rounded-xl transition-all duration-200"
        style={
          area
            ? {
                top: area.top - RECUO,
                left: area.left - RECUO,
                width: area.width + RECUO * 2,
                height: area.height + RECUO * 2,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.7)',
                outline: '2px solid rgba(255,255,255,0.9)',
              }
            : {
                top: '50%',
                left: '50%',
                width: 0,
                height: 0,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.7)',
              }
        }
      />

      {/* Card com a explicação do passo */}
      <div
        className="fixed z-[62] rounded-xl bg-white p-4 shadow-2xl transition-all duration-200"
        style={{ top, left, width: LARGURA_CARD }}
        role="dialog"
        aria-label={passo.titulo}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">{passo.titulo}</h2>
          <button
            onClick={onFechar}
            className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar o passo a passo"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm leading-snug text-slate-600">{passo.texto}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1">
            {PASSOS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === indice ? 'w-4 bg-brand-600' : 'w-1.5 bg-slate-200'
                }`}
                aria-hidden
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {indice > 0 && (
              <button
                onClick={voltar}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            <button
              onClick={() => (ultimo ? onFechar() : avancar())}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {ultimo ? (
                <>
                  <Check size={14} /> Concluir
                </>
              ) : (
                <>
                  Próximo <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {!ultimo && (
          <button
            onClick={onFechar}
            className="mt-2 w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Pular apresentação
          </button>
        )}
      </div>
    </>
  )
}
