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
  - **Descoberta:** além do atalho `F`, o modo foco também é acionável pela
    **paleta de comandos** (`Ctrl+K` → "foco") — o rótulo alterna entre
    "Entrar/Sair" conforme o estado (adicionado na v0.5.1). Falta só um botão
    *dedicado* na UI, que entra no item 3 (header).
  - Verificado no browser: `F` entra/sai, botão de saída funciona, o guard impede
    o toggle ao digitar, e a paleta expõe/alterna a ação. Build limpo.
    Versões → **0.5.0** (modo foco) + **0.5.1** (ação na paleta).

### 3. Header Flutuante (Top Dock) + Pílula de Visão — ✅ FEITO (junto com o 4)

O redesign de fato: Toolbar virou dock flutuante com cantos arredondados,
translucidez e sombra, com a pílula de alternância de visão no centro.
**Feito em conjunto com o item 4** (Side Drawer) porque o header minimalista
precisa do drawer como lar dos botões administrativos — separá-los deixaria
ações órfãs.

- **Escopo entregue:**
  - Zona esquerda: logo + `CenarioSelector` + nome do grupo editável.
  - Zona central: pílula `Organograma | Tabela | Cartões`.
  - Zona direita: `+ Adicionar` (primário) + gatilho **Buscar `Ctrl K`** (abre a
    paleta, item 1) + botão de **Foco** (item 2) + `☰` que abre o Side Drawer.
  - Duas faixas flutuantes (dock + filtros), cada uma um cartão
    `rounded-2xl bg-white/80 backdrop-blur-md shadow-lg`; o fundo do app virou
    `bg-slate-100` para os cartões "descolarem".
  - Headcount (Cargos/Pessoas/Gestores/Vagas) foi para a faixa de filtros.
- **Sobre o risco do glassmorphism:** resolvido evitando-o. O dock fica em **fluxo
  normal** (reserva seu espaço, não sobrepõe o canvas nem as visões tabela/cartões),
  então o `backdrop-blur` não incide sobre nós coloridos — sem sopa visual e sem
  problema de contraste. Um overlay glass *sobre* o canvas continua possível como
  ajuste futuro, se o usuário quiser esse look específico.
- **Tour:** os `data-tour` de `empresas`/`layout`/`arquivo` saíram do header; os
  três passos viraram **um só** apontando para o `☰` (`data-tour="menu"`).
- **Arquivos:** `Toolbar.jsx` (reescrita), `SideDrawer.jsx` (novo), `App.jsx`,
  `Tour.jsx`.
- **Notas:** verificado no browser — dock, pílula, Buscar→paleta, Foco, ☰→drawer,
  e o passo "menu" do tour destacando o `☰`. Tabela/Cartões sem sobreposição.
  Versão → **0.6.0**.

### 4. Side Drawer (Menu Lateral Retrátil) — ✅ FEITO (junto com o 3)

Painel lateral deslizante (desliza da direita) com as ações administrativas que
saíram do header.

- **Escopo entregue** (`SideDrawer.jsx`):
  - **Arquivo:** Exportar JSON, Importar JSON (com erro embutido). Restaurar
    backups continua na faixa âmbar do topo (App), como antes.
  - **Grupo:** Cadastrar empresas (abre `EmpresasModal`), Layout
    automático/manual, Reorganizar (quando manual).
  - **Ajuda:** Passo a passo (tour) + lista de **atalhos** (`Ctrl K`, `F`).
  - **Rodapé:** versão do app + data do build (saiu do header).
  - Fecha no `Esc`, no clique fora, e depois de abrir outra tela.
- **Notas:** ver item 3 — foram entregues na mesma mudança.

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
