import { useEffect, useRef, useState } from 'react'
import {
  X,
  Upload,
  Download,
  ImageDown,
  Building2,
  LayoutGrid,
  Move,
  RotateCcw,
  HelpCircle,
  Command,
  Maximize2,
} from 'lucide-react'
import { exportarJson, validarImportacao } from '../lib/arquivo.js'
import { APP_VERSION, dataBuildFormatada } from '../lib/versao.js'

/** Item de ação do drawer: ícone à esquerda, título + descrição opcional */
function ItemDrawer({ icone: Icone, titulo, descricao, onClick, tom = 'padrao', disabled = false }) {
  const tons = {
    padrao: 'text-slate-500 group-hover:text-brand-600',
    ativo: 'text-amber-600',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? descricao : undefined}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span className={`shrink-0 ${disabled ? 'text-slate-400' : tons[tom]}`}>
        <Icone className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-700">{titulo}</span>
        {descricao && <span className="block text-xs text-slate-400">{descricao}</span>}
      </span>
    </button>
  )
}

function Secao({ titulo, children }) {
  return (
    <div>
      <div className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {titulo}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

/**
 * Menu lateral retrátil (Side Drawer) com as ações administrativas que saíram do
 * header: arquivos (exportar/importar), cadastro de empresas, layout e ajuda.
 * Fecha no Esc, no clique fora e após qualquer ação que abra outra tela.
 */
export default function SideDrawer({
  onFechar,
  cenarios = [],
  cenarioAtivoId,
  dados,
  onImportar,
  onExportarImagem,
  onAbrirEmpresas,
  layoutManual,
  onToggleManual,
  onReorganizar,
  onAbrirTour,
}) {
  const inputArquivo = useRef(null)
  const [erroImport, setErroImport] = useState('')
  const [exportandoImagem, setExportandoImagem] = useState(false)
  const [erroExportImagem, setErroExportImagem] = useState('')

  async function aoExportarImagem() {
    if (!onExportarImagem || exportandoImagem) return
    setErroExportImagem('')
    setExportandoImagem(true)
    try {
      await onExportarImagem()
    } catch {
      setErroExportImagem('Não foi possível gerar a imagem. Tente novamente.')
    } finally {
      setExportandoImagem(false)
    }
  }

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  function aoEscolherArquivo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    const leitor = new FileReader()
    leitor.onerror = () => setErroImport('Não foi possível ler o arquivo escolhido.')
    leitor.onload = () => {
      const resultado = validarImportacao(leitor.result)
      if (resultado.erro) {
        setErroImport(resultado.erro)
      } else {
        setErroImport('')
        onImportar(resultado)
        onFechar()
      }
    }
    leitor.readAsText(arquivo)
  }

  const dataBuild = dataBuildFormatada()

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
      onClick={onFechar}
    >
      <aside
        className="flex h-full w-80 max-w-full flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-sm font-bold text-slate-800">Menu &amp; Configurações</h2>
          <button
            onClick={onFechar}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          <Secao titulo="Arquivo">
            <ItemDrawer
              icone={Upload}
              titulo="Exportar backup (JSON)"
              descricao="Todos os organogramas num arquivo"
              onClick={() => exportarJson({ cenarios, cenarioAtivoId, dados })}
            />
            <ItemDrawer
              icone={Download}
              titulo="Importar JSON"
              descricao="Restaurar ou trazer de outro computador"
              onClick={() => inputArquivo.current?.click()}
            />
            {erroImport && (
              <p className="mx-3 mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                Erro ao importar: {erroImport}
              </p>
            )}
            <ItemDrawer
              icone={ImageDown}
              titulo={exportandoImagem ? 'Gerando imagem…' : 'Exportar imagem (PNG)'}
              descricao={
                onExportarImagem
                  ? 'A árvore inteira, do jeito que está na tela — filtros e modo confidencial inclusos'
                  : 'Disponível na visão Organograma'
              }
              disabled={!onExportarImagem || exportandoImagem}
              onClick={aoExportarImagem}
            />
            {erroExportImagem && (
              <p className="mx-3 mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {erroExportImagem}
              </p>
            )}
            <input
              ref={inputArquivo}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={aoEscolherArquivo}
            />
          </Secao>

          <Secao titulo="Grupo">
            <ItemDrawer
              icone={Building2}
              titulo="Cadastrar empresas"
              descricao="Empresas do grupo, cada uma com sua cor"
              onClick={() => {
                onAbrirEmpresas()
                onFechar()
              }}
            />
            <ItemDrawer
              icone={layoutManual ? Move : LayoutGrid}
              titulo={layoutManual ? 'Layout manual (ativo)' : 'Layout automático (ativo)'}
              descricao={
                layoutManual
                  ? 'Arraste os blocos livremente — clique para voltar ao automático'
                  : 'Organizado por níveis — clique para arrastar livremente'
              }
              tom={layoutManual ? 'ativo' : 'padrao'}
              onClick={onToggleManual}
            />
            {layoutManual && (
              <ItemDrawer
                icone={RotateCcw}
                titulo="Reorganizar automaticamente"
                descricao="Descarta as posições manuais"
                onClick={onReorganizar}
              />
            )}
          </Secao>

          <Secao titulo="Ajuda">
            <ItemDrawer
              icone={HelpCircle}
              titulo="Passo a passo"
              descricao="Reabrir o tour guiado"
              onClick={() => {
                onAbrirTour()
                onFechar()
              }}
            />
            <div className="mx-1 mt-1 rounded-xl bg-slate-50 px-3 py-2.5">
              <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Atalhos
              </div>
              <div className="flex items-center justify-between py-0.5 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Command className="h-3.5 w-3.5 text-slate-400" /> Buscar / comandos
                </span>
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  Ctrl K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-0.5 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-slate-400" /> Modo foco
                </span>
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  F
                </kbd>
              </div>
            </div>
          </Secao>
        </div>

        {/* Rodapé com a versão */}
        <div className="border-t border-slate-100 px-4 py-3">
          <span
            className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-500"
            title={
              dataBuild
                ? `Versão ${APP_VERSION} — build de ${dataBuild}`
                : `Versão ${APP_VERSION}`
            }
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            Orga v{APP_VERSION}
            {dataBuild && <span className="text-slate-400">· {dataBuild}</span>}
          </span>
        </div>
      </aside>
    </div>
  )
}
