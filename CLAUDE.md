# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Orga is a single-page React app for building and editing company org charts ("organograma"). No backend — state lives in `localStorage` and can be exported/imported as JSON. All UI text, variable names, and comments in the codebase are in Portuguese (pt-BR); match that convention when adding code.

## Knowledge base (`docs/`)

This file is the operating manual for *this* repository. Deeper, topic-by-topic documentation —
written in pt-BR and portable to other projects — lives in [`docs/`](docs/README.md):
[tecnologias.md](docs/tecnologias.md) (stack, configuration and real pitfalls),
[padroes-ui.md](docs/padroes-ui.md) (interface conventions and why),
[regras-organograma.md](docs/regras-organograma.md) (domain rules),
[modelo-dados.md](docs/modelo-dados.md) (data model, storage, versioning, import/export).

Read the relevant one before changing behaviour in that area — they record the reasoning behind
decisions that look arbitrary in the code. Keep them updated when the rules change.

## Commands

```
npm run dev       # start Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
```

There is no test suite and no linter configured. `src/lib/*.js` are plain ESM with no React/DOM dependencies and no third-party imports, so they can be imported directly by Node for ad-hoc verification of the pure logic.

## Architecture

`App.jsx` owns all state and composes everything: `useOrgChart` for the persisted data, plus local `useState` for the side panel and the view filters. There is no router and no other state management.

**Global keyboard shortcuts** live in `App.jsx` as `document` keydown listeners: `Ctrl/Cmd+K` toggles the Command Palette (`paletaAberta`), and `F` toggles focus mode (`modoFoco`). Focus mode hides the Toolbar, banners and side panel — only the canvas stays — and best-effort mirrors the browser Fullscreen API (a `fullscreenchange` listener exits the mode when the user leaves fullscreen). Both `F` and the palette guard against firing while the user is typing in an input/textarea/contenteditable. These are **view-only** (never persisted), like the filters.

- **`src/hooks/useOrgChart.js`** — the single source of truth. The real state is `{ cenarios, ativoId }`: a **list of scenarios**, each `{ id, nome, criadoEm, modificadoEm, dados }`, where `dados = { version, empresa, empresas, layoutManual, pessoas }`. It exposes `dados` (the active scenario's chart) so every chart mutator (`salvarPessoa`, `excluirPessoa`, `moverPessoa`, `reordenarPessoa`, `alterarNivelBloco`, `alterarNivelEquipe`, `limparPosicoes`, `salvarEmpresa`, `excluirEmpresa`, `reordenarEmpresas`) keeps working unchanged — they go through the internal `setDados`, which rewrites only the active scenario. Scenario-level ops: `selecionarCenario`, `criarCenario` (from scratch / clone whole / clone selected teams), `duplicarCenario`, `renomearCenario`, `excluirCenario` (backs up before removing), `copiarPessoasParaCenario` (clones a block/team into another scenario, then runs `normalizarEmpresas` so foreign `empresaIds` don't dangle). Autosave writes `orga:cenarios` + `orga:cenario_ativo`, and keeps `orga:dados` mirrored to the active scenario for backward compatibility. Load prefers `orga:cenarios`, else migrates the legacy `orga:dados` into a single scenario. `substituirDados` branches on the import `tipo`: `pacote` replaces the whole workspace, `unico` appends one scenario. Plus the backup helpers (`listarBackups`, `lerBackup`, `descartarBackups`, `guardarBackupDoAtual`). `excluirPessoa` reattaches orphaned subordinates to the deleted person's own manager; `excluirEmpresa` strips the id from every `empresaIds`.
- **`src/lib/modelo.js`** — the domain core, all pure: `CURRENT_VERSION` and `migrarDados`, the two normalizers, `comDescendentes`, `empresasEfetivas` + `SEM_EMPRESA`, and the `CORES_EMPRESA` palette. `normalizarGestores` enforces the one hard invariant: anyone referenced as another person's `gestorId` gets `ehGestor: true`, even if `false` was saved. `normalizarEmpresas` defaults `dados.empresas` / `pessoa.empresaIds` and drops `empresaIds` pointing at deleted companies. Both run on load and on import, so they also self-heal inconsistent data. Don't bypass them when building `pessoas` arrays elsewhere.
- **`src/lib/layout.js`** — turns `pessoas` into React Flow nodes/edges (see "Layout" below).
- **`src/lib/versao.js`** — `APP_VERSION` / `BUILD_DATE` (see "Storage versioning" below).
- **`src/lib/arquivo.js`** — JSON export/import. `validarImportacao` is the sole gate for external data: validates shape, rejects duplicate ids (people *and* companies), dangling `gestorId`s and cycles (`detectarCiclo`), then runs both normalizers. Any path that injects a `pessoas` array from outside must go through it. Export adds two informational fields the importer deliberately drops: `appVersion` and `exportadoEm`.
- **`src/components/PessoaForm.jsx`** — create/edit side panel, and the home of the hierarchy rules that aren't in `arquivo.js` (see "Validation rules").
- **`src/components/PessoaNode.jsx`** — the custom node. Gestor nodes render a "+" button that calls `data.onAddSubordinado`, which opens the form pre-filled with that manager and `nivel + 1`.
- **`src/components/MultiSelect.jsx`** — the one dropdown multi-select, shared by the toolbar filters and the company picker in the person form. `full` switches between the compact toolbar trigger and a full-width form field; `corDe` adds a color dot per option. Every dropdown carries a search box (autofocused on open, Escape closes and clears) that matches accent- and case-insensitively against the **formatted** label — so it works for options stored as ids but rendered as names. Prefer extending this over adding another checkbox list — the form deliberately uses a dropdown so the list can't grow and push the save button off-screen.
- **`src/components/Toolbar.jsx`** — the header, deliberately split into two rows: an **app bar** (logo, editable group name, headcount metrics, add, company registry, layout toggle, export/import, the `?` that reopens the tour, and the version badge) and a **filter bar** on a grey band (the `FiltroMultiSelect` wrappers over `MultiSelect`, the label toggle, a "Limpar (N)" button, and the `X de Y cargos` counter). Keep actions in the first row and view-only controls in the second — that separation is the point of the layout. Secondary labels collapse to icon-only below `lg`.
- **`src/components/Tour.jsx`** — the onboarding walkthrough (spotlight + step card). Steps live in the exported `PASSOS` array; each one points at a `data-tour="<nome>"` attribute somewhere in the UI, and a step whose target isn't in the DOM is skipped automatically. **If you move or rename a highlighted element, update its `data-tour` attribute** or that step silently disappears. It opens on first visit (guarded by the `orga:tour-visto` localStorage key, separate from the chart data) and from the `?` button in the toolbar.
- **`src/components/EmpresasModal.jsx`** — the company registry (add/rename/recolor/delete). Deleting warns how many positions reference the company, then `excluirEmpresa` strips the id from every `empresaIds`.
- **`src/components/OrgCanvas.jsx`** — the React Flow wrapper and the node **context menu** (right-click): show a manager's whole team, isolate a block, reorder siblings, and raise/lower the level of a single block or of an entire team. The menu's enabled/disabled states duplicate the level rules enforced in `useOrgChart` — if you change one, change the other, or buttons will offer actions the mutator silently refuses.
- **`src/components/CenarioSelector.jsx` + `ModalCenario.jsx` + `ModalCopiarBloco.jsx`** — the multi-scenario UI: switch/create/duplicate/rename/delete scenarios, and copy a block+team across them. The two modals **call hooks**, so `App.jsx` mounts them conditionally (`{aberto && <Modal…/>}`) rather than letting them early-return — an early-return before a `useState` breaks the Rules of Hooks and white-screens the app.
- **`src/components/TabelaView.jsx` + `CartoesView.jsx`** — alternative views of the same `pessoasVisiveis` (sortable table with CSV export; cards grouped by area). `App.jsx`'s `modoVisao` (`canvas` | `tabela` | `cartoes`) picks one. They read the same filtered list the canvas does, so filters apply everywhere.
- **`src/components/CommandPalette.jsx`** — the `Ctrl/Cmd+K` command palette. `App.jsx` owns the global key listener (`paletaAberta`) and mounts it conditionally. It holds **no data state** — every item just calls an `App` callback that already exists (isolate a person, switch view/scenario, add person, open the company registry, toggle manual layout, toggle focus mode, reopen the tour). The focus-mode item's label flips between "Entrar/Sair" based on the `modoFoco` prop. Reuses the same accent-insensitive `normalizar` search as `MultiSelect`. Keyboard: ↑/↓ move, Enter runs, Esc/backdrop close. **It has no visible trigger yet** — discoverability (a `Ctrl+K` hint) is deferred to the header redesign; see [redesign-plano.md](docs/redesign-plano.md). Export/import is deliberately out of scope so its logic isn't duplicated from the Toolbar.
- **`src/data/exemplo.js`** — seed data loaded when `localStorage` is empty or unreadable.

### Storage versioning and the never-delete rule

Two unrelated versions exist; do not conflate them:

- **`CURRENT_VERSION`** (`modelo.js`) — the **data format**. Only bump it when the shape of `dados` genuinely changes, and add the matching step to `migrarDados`. It is declared in exactly one place and imported by `exemplo.js`, `arquivo.js` and `useOrgChart.js` — **never re-type the literal**. It used to be duplicated across three files, and one of them drifting meant imported files were saved under a version the loader rejected, which silently destroyed data on the next reload.
- **`APP_VERSION`** (`lib/versao.js`) — the **release**, injected by Vite from `package.json` (`__APP_VERSION__` / `__BUILD_DATE__`, see `vite.config.js`). Purely informational: shown as a badge next to the `?` button, and compared against the `orga:versao-vista` key to show the "app updated" banner. Publishing a new release never touches anyone's data. Note the dev server bakes it at startup — bumping `package.json` needs a `npm run dev` restart to show up.

### Releasing: always bump the version

**Every change that reaches `master` ships with a bump of `version` in `package.json`** — the badge in the header is how the user tells which build is live, and the "app updated" banner only fires when the number actually changes. Do it in the same commit as the change, not afterwards.

- **Patch** (`0.2.0` → `0.2.1`) — bug fixes and internal cleanup: nothing the user has to relearn.
- **Minor** (`0.2.1` → `0.3.0`) — a new feature, or a behaviour change in something that already existed.
- Docs-only commits don't need a bump — nothing in `dist/` changes.

This is the **app version only**. Never bump `CURRENT_VERSION` for a release; that one tracks the shape of the saved data and carries migration consequences.

**The hard rule: the app never destroys user data.** Loading runs `migrarDados`, which brings older formats forward (all changes so far have been additive, so the normalizers fill the defaults). It returns `null` only for an unusable payload — invalid shape, or a version newer than this build. In that case, and before an import replaces everything, the raw content is copied to an `orga:backup:<timestamp>` key and `App.jsx` shows an amber banner offering to download it. There is no `removeItem` on user data anywhere in the codebase; keep it that way.

### Layout

Auto layout is hand-rolled in `calcularLayout` — there is no layout library. `layoutNode` recurses over the visible tree bottom-up, packing each node's children side by side and centring the parent over them; sibling order follows the order of the `pessoas` array, which is what `reordenarPessoa` manipulates. Roots are laid out left to right, each offset past the previous subtree's width.

That recursion produces **X only**. Y comes from each person's `nivel`, so everyone at the same level shares a row even when the manager chain skips levels. Rows are keyed by the sorted distinct `nivel` values present, so an entirely absent level collapses instead of leaving a blank row. A final pass gives a position to any node the recursion never reached (only possible if the hierarchy contains a cycle), so React Flow never receives `position: undefined`.

Manual mode (`layoutManual: true`) uses each person's saved `posicao` and makes nodes draggable.

### View filters and hidden-ancestor edges

The filters (`filtroArea`, `filtroSetor`, `filtroEmpresas`, `filtroGestores`, `filtroNiveis` in `App.jsx`) are all **multi-select arrays** and are view-only — never persisted, never exported, as is the `mostrarEtiquetasEmpresa` toggle. Area/setor/company filtering matches a person, then walks up the `gestorId` chain adding every ancestor, so the path to the top stays visible even though managers usually don't carry the analysts' area/setor. The level filter shows exactly the checked levels (it is not "up to N"), so it can hide an intermediate manager.

The company filter matches on **effective** companies, not the raw field. `empresasEfetivas` (in `modelo.js`) returns the person's own `empresaIds` when set; otherwise it walks up the `gestorId` chain to inherit. The inheritance has one deliberate rule: a manager tagged with **more than one company is corporate** (serves the whole group) and **does not propagate** — the walk stops and returns nothing. Without it, tagging the CEO with every company would make the entire chart match every filter. So tagging a single-company director covers their branch, while the multi-company CEO does not drag unrelated branches in. Someone with no effective company matches only the `SEM_EMPRESA` sentinel, which the Toolbar appends to the filter options as "Sem empresa".

The manager filter lists everyone with `ehGestor` (open positions included, labelled `Vaga: <cargo>`) and matches the selected people plus everything under them via `comDescendentes` in `modelo.js`; the shared ancestor walk then adds the chain above, so the branch keeps its context.

`pessoaIsolada` (set by "Isolar bloco" in the context menu) is a separate mode, not another filter: it shows one person plus their chain to the top and **replaces** the other filters rather than combining with them. It still counts toward `filtrosAtivos` and is cleared by "Limpar".

That means the visible set can omit someone's direct manager. This is why `OrgCanvas` takes both `pessoas` (visible) and `todasPessoas` (full list), and passes both to `paraFluxo`/`calcularLayout`: when a direct manager is hidden, they walk the full list up to the nearest **visible** ancestor and draw the edge to it, styled dashed + animated to signal the skipped link. Keep both arguments threaded through if you touch these functions.

### Validation rules (`PessoaForm.jsx`)

- A person with subordinates cannot have `ehGestor` unchecked — the checkbox is disabled in that case, and submit re-checks it.
- The chosen manager must be at a level strictly above (`gestor.nivel < nivel`).
- A person's own `nivel` must stay strictly above their subordinates' lowest `nivel`.
- A person can't be assigned a manager who is one of their own descendants (BFS over `gestorId`).
- Only people with `ehGestor` appear in the manager dropdown (plus the currently assigned one).
- `descricao` is capped at `MAX_LINHAS_DESC` lines on input; `PessoaNode` clamps it with `line-clamp-5` — keep the two in sync.

### Data model

`dados = { version, empresa, empresas, layoutManual, pessoas }` — `empresa` is the group title in the toolbar; `empresas` is the registry of `{ id, nome, cor }` for the companies in the group.

`pessoa = { id, nome, cargo, nivel, area, setor, descricao, gestorId, ehGestor, vagaAberta, empresaIds, posicao }`

- `nivel` is an integer (1 = top) used for vertical ordering and the block's accent color — the number itself is never shown in the chart.
- `gestorId` points to another person's `id`, or `null` for top-of-chart.
- `vagaAberta: true` means an open position: `nome` is empty and the node renders dashed with a "Vaga em aberto" label. `validarImportacao` only allows an empty `nome` when this is set.
- `empresaIds` lists the companies the position serves (a position can serve several, or none — none means "inherit from the manager", see the filter section). Chips render **only the explicitly assigned** companies, never the inherited ones, gated by `data.mostrarEtiquetasEmpresa` — `OrgCanvas` injects that flag and an `empresasPorId` map into each node's `data`, alongside `onAddSubordinado`.
- `posicao` (`{x, y}` or `null`) is only used/persisted when `layoutManual` is on.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config.js`). Theme tokens (`--color-brand-*`, `--color-nivel-1..6`) are defined with `@theme` in `src/index.css` — change org-chart level colors and brand colors there, not per-component.
