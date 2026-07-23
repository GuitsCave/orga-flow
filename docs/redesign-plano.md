# Plano de Execução — Redesign "Zen Canvas"

Doc de trabalho para o redesign da interface descrito em
[design-header-futuro.md](design-header-futuro.md). **Fazemos um item por vez.**
Cada item tem status, escopo e arquivos afetados, para que qualquer sessão
(mesmo depois de uma pausa ou reinício) saiba exatamente onde retomar.

## Como usar este doc

- Trabalhe **apenas no item marcado `▶ EM ANDAMENTO`**. Só um por vez.
- Ao concluir: marque `[x]`, mude o status para `✅ FEITO`, anote em "Notas"
  o que ficou diferente do planejado, e **suba a versão** conforme o
  [CLAUDE.md](../CLAUDE.md) (feature = minor).
- Ao começar o próximo: mude o status dele para `▶ EM ANDAMENTO`.
- Nada aqui é definitivo — ajuste o escopo se descobrirmos algo melhor no caminho.

## Legenda de status

- `⬜ PENDENTE` — ainda não começamos
- `▶ EM ANDAMENTO` — item ativo desta sessão
- `✅ FEITO` — concluído, commitado e versão subida
- `💤 ADIADO` — movido para [ideias-futuras.md](ideias-futuras.md)

---

## Ordem de execução

A ordem foi escolhida para entregar valor cedo com baixo risco: começamos pelo
que reaproveita lógica existente e não toca em dados/hooks frágeis, e só depois
partimos para o redesign visual pesado.

### 1. Command Palette (`Ctrl + K` / `Cmd + K`) — ✅ FEITO

Menu de comando central para buscar colaborador/cargo e disparar ações sem mouse.

- **Por que primeiro:** maior valor por menor custo. Reaproveita a busca já
  existente (accent/case-insensitive do `MultiSelect`) e as ações já
  centralizadas no `App.jsx`.
- **Escopo entregue:**
  - Atalho global `Ctrl/Cmd + K` abre/fecha um overlay de busca central.
  - Buscar pessoa/cargo → selecionar isola o bloco no canvas (foco + volta à
    visão organograma).
  - Ações rápidas: adicionar pessoa, alternar visão (canvas/tabela/cartões),
    cadastrar empresas, novo cenário, alternar layout manual, abrir tour, e
    "Ir para" cada outro cenário.
  - `Esc` e clique fora fecham; navegação por ↑/↓ + Enter; hover também seleciona.
- **Arquivos:** novo `src/components/CommandPalette.jsx`; `App.jsx` (estado
  `paletaAberta`, listener global `Ctrl/Cmd+K`, wiring das ações existentes).
- **Notas:**
  - Export/import ficou **fora** do v1 para não duplicar a lógica que hoje vive
    na `Toolbar` — dá pra adicionar depois que o Side Drawer (item 4) centralizar
    as ações de arquivo.
  - **Descoberta (gatilho visível):** sem um botão na UI, o usuário só chega pelo
    atalho. Decidido **adiar o gatilho visível para o item 3 (header)**, onde uma
    dica `Ctrl+K` se encaixa naturalmente — evita mexer na `Toolbar` duas vezes.
    Já anotado no escopo do item 3.
  - Verificado no browser: busca de pessoa isola o bloco; setas + Enter navegam e
    executam; `Esc`/clique-fora fecham. Build limpo. Versão → **0.4.0**.

### 2. Modo Foco / Tela Cheia Limpa (`F`) — ✅ FEITO

Oculta 100% da interface e deixa só o canvas interativo — para reuniões.

- **Por que agora:** barato, alto impacto visual, não toca em dados.
- **Escopo entregue:**
  - Atalho `F` alterna o modo foco; esconde Toolbar + faixa de filtros + banners,
    mantendo o canvas (com os controles de zoom do React Flow) navegável.
  - `Esc`, `F` de novo, ou um **botão flutuante discreto** (canto superior direito,
    opacidade baixa que sobe no hover) saem do modo.
  - Espelha a **tela cheia real** do navegador via Fullscreen API (best-effort:
    se bloqueada, o modo ainda esconde a interface do app); sair da tela cheia
    pelo navegador (Esc/F11) também sai do modo foco (`fullscreenchange`).
  - **Guard:** `F` é ignorado enquanto o usuário digita em input/textarea/campo
    editável e com modificadores — senão "f" num nome ativaria o modo.
- **Arquivos:** `App.jsx` (estado `modoFoco`, listeners de teclado e de tela
  cheia, render condicional da Toolbar/banners, botão flutuante de saída).
- **Notas:**
  - **Descoberta (gatilho visível):** igual à paleta, sem botão de *entrada* na UI
    — só o atalho `F`. Adiado para o item 3 (header). Já anotado no escopo dele.
  - Verificado no browser: `F` entra/sai, botão de saída funciona, e o guard
    impede o toggle ao digitar. Build limpo. Versão → **0.5.0**.

### 3. Header Flutuante (Top Dock) + Pílula de Visão — ⬜ PENDENTE

O redesign de fato: Toolbar vira dock flutuante com cantos arredondados e
translucidez, com a pílula de alternância de visão no centro.

- **Risco conhecido — glassmorphism sobre o canvas:** `backdrop-blur` sobre nós
  coloridos e linhas pode virar sopa visual. Usar fallback sólido generoso
  (ex.: `bg-white/80`, não `/50`) e **testar contraste de verdade** no browser
  antes de fechar.
- **Escopo:**
  - Zona esquerda: logo + seletor de cenários + nome do grupo editável.
  - Zona central: pílula `Organograma | Tabela | Cartões` (hoje o `modoVisao`).
  - Zona direita: `+ Adicionar` como ação primária + acesso ao Side Drawer (item 4).
  - **Gatilhos visíveis dos itens 1 e 2:** um botão/campo discreto de busca com a
    dica `Ctrl+K` (paleta) e um botão de entrar no modo foco com a dica `F` —
    para o usuário descobrir os atalhos pela UI.
  - Manter os `data-tour="..."` ao mover elementos (senão passos do Tour somem —
    ver CLAUDE.md / Tour.jsx).
- **Arquivos prováveis:** `Toolbar.jsx` (reestruturação grande), `App.jsx`,
  possivelmente `index.css` (tokens de blur/sombra).
- **Notas:** _(preencher ao executar)_

### 4. Side Drawer (Menu Lateral Retrátil) — ⬜ PENDENTE

Painel lateral deslizante para funções administrativas, despoluindo o header.

- **Depende de:** item 3 estar pronto (o gatilho vive no header novo).
- **Escopo:**
  - Gerenciador de Arquivos: exportar/importar JSON, restaurar backups.
  - Cadastro do Grupo: empresas (abre o `EmpresasModal`) e reordenação.
  - Ajuda e Padrões: Tour, atalhos de teclado, versão do app.
- **Arquivos prováveis:** novo `src/components/SideDrawer.jsx` (pode reusar
  `ModalBase` para Esc/fundo), `Toolbar.jsx`/`App.jsx` para o wiring.
- **Notas:** _(preencher ao executar)_

### 5. Modo Confidencial (Anonimizador) — ⬜ PENDENTE

Mascara nomes sensíveis em 1 clique (reuniões com terceiros/consultores).

- **Por que subimos a prioridade:** é feature de venda, não "complementar" —
  muitas empresas não mostram o org real para fora.
- **Escopo:**
  - Toggle que substitui nomes por iniciais/rótulos genéricos (ex.: "Colaborador",
    cargo mantido). **View-only, nunca persiste nem exporta** — como os filtros.
  - Vale em canvas, tabela e cartões.
- **Arquivos prováveis:** `App.jsx` (flag view-only), `PessoaNode.jsx`,
  `TabelaView.jsx`, `CartoesView.jsx`.
- **Notas:** _(preencher ao executar)_

---

## Fora do plano

- **HUD flutuante de zoom/status no rodapé** — descartado. O `<Controls>` nativo
  do React Flow já cobre isso de forma discreta no cantinho. Se um dia quisermos,
  dá pra reestilizar o componente nativo — mas não é item de trabalho.
