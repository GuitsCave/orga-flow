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

There is no test suite and no linter configured. `src/lib/*.js` are plain ESM with no React/DOM dependencies (only `layout.js` pulls in dagre), so they can be imported directly by Node for ad-hoc verification of the pure logic.

## Architecture

`App.jsx` owns all state and composes everything: `useOrgChart` for the persisted data, plus local `useState` for the side panel and the view filters. There is no router and no other state management.

- **`src/hooks/useOrgChart.js`** — the single source of truth for persisted data. Holds `dados = { version, empresa, layoutManual, pessoas }` and debounce-autosaves it to `localStorage` (key `orga:dados`). Exposes the mutators (`salvarPessoa`, `excluirPessoa`, `moverPessoa`, `limparPosicoes`, `substituirDados`). `excluirPessoa` reattaches orphaned subordinates to the deleted person's own manager.
- **`src/lib/modelo.js`** — the two normalizers plus the `CORES_EMPRESA` palette. `normalizarGestores` enforces the one hard invariant: anyone referenced as another person's `gestorId` gets `ehGestor: true`, even if `false` was saved. `normalizarEmpresas` defaults `dados.empresas` / `pessoa.empresaIds` and drops `empresaIds` pointing at deleted companies. Both run on load and on import, so they also self-heal inconsistent data. Don't bypass them when building `pessoas` arrays elsewhere.
- **`src/lib/layout.js`** — turns `pessoas` into React Flow nodes/edges (see "Layout" below).
- **`src/lib/arquivo.js`** — JSON export/import. `validarImportacao` is the sole gate for external data: validates shape, rejects duplicate ids, dangling `gestorId`s and cycles (`detectarCiclo`), then runs `normalizarGestores`. Any path that injects a `pessoas` array from outside must go through it.
- **`src/components/PessoaForm.jsx`** — create/edit side panel, and the home of the hierarchy rules that aren't in `arquivo.js` (see "Validation rules").
- **`src/components/PessoaNode.jsx`** — the custom node. Gestor nodes render a "+" button that calls `data.onAddSubordinado`, which opens the form pre-filled with that manager and `nivel + 1`.
- **`src/components/MultiSelect.jsx`** — the one dropdown multi-select, shared by the toolbar filters and the company picker in the person form. `full` switches between the compact toolbar trigger and a full-width form field; `corDe` adds a color dot per option. Every dropdown carries a search box (autofocused on open, Escape closes and clears) that matches accent- and case-insensitively against the **formatted** label — so it works for options stored as ids but rendered as names. Prefer extending this over adding another checkbox list — the form deliberately uses a dropdown so the list can't grow and push the save button off-screen.
- **`src/components/Toolbar.jsx`** — the header, deliberately split into two rows: an **app bar** (logo, group name, add, company registry, layout toggle, export/import) and a **filter bar** on a grey band (the `FiltroMultiSelect` wrappers over `MultiSelect`, the label toggle, a "Limpar (N)" button, and the `X de Y cargos` counter). Keep actions in the first row and view-only controls in the second — that separation is the point of the layout. Secondary labels collapse to icon-only below `lg`.
- **`src/components/Tour.jsx`** — the onboarding walkthrough (spotlight + step card). Steps live in the exported `PASSOS` array; each one points at a `data-tour="<nome>"` attribute somewhere in the UI, and a step whose target isn't in the DOM is skipped automatically. **If you move or rename a highlighted element, update its `data-tour` attribute** or that step silently disappears. It opens on first visit (guarded by the `orga:tour-visto` localStorage key, separate from the chart data) and from the `?` button in the toolbar.
- **`src/components/EmpresasModal.jsx`** — the company registry (add/rename/recolor/delete). Deleting warns how many positions reference the company, then `excluirEmpresa` strips the id from every `empresaIds`.
- **`src/data/exemplo.js`** — seed data loaded when `localStorage` is empty or version-stale.

### Storage versioning

`useOrgChart.js` defines `CURRENT_VERSION` and gates loading on an exact match: if the stored `version` differs or is missing, **localStorage is wiped and the example seed is loaded**. Bumping it therefore discards every user's saved chart, so only do it for a genuinely breaking model change — and keep the literal `version` in `exemplo.js` and in the object `validarImportacao` returns in sync with it.

### Layout

Auto layout uses `@dagrejs/dagre` for **X only**. Y comes from each person's `nivel`, so everyone at the same level shares a row even when the manager chain skips levels. Rows are keyed by the sorted distinct `nivel` values present, so an entirely absent level collapses instead of leaving a blank row. Because moving nodes onto their level's row can make them collide, a final pass pushes overlapping nodes apart horizontally within each row.

Manual mode (`layoutManual: true`) uses each person's saved `posicao` and makes nodes draggable.

### View filters and hidden-ancestor edges

The filters (`filtroArea`, `filtroSetor`, `filtroEmpresas`, `filtroGestores`, `filtroNiveis` in `App.jsx`) are all **multi-select arrays** and are view-only — never persisted, never exported, as is the `mostrarEtiquetasEmpresa` toggle. Area/setor/company filtering matches a person, then walks up the `gestorId` chain adding every ancestor, so the path to the top stays visible even though managers usually don't carry the analysts' area/setor. The level filter shows exactly the checked levels (it is not "up to N"), so it can hide an intermediate manager.

The company filter matches on **effective** companies, not the raw field. `empresasEfetivas` (in `modelo.js`) returns the person's own `empresaIds` when set; otherwise it walks up the `gestorId` chain to inherit. The inheritance has one deliberate rule: a manager tagged with **more than one company is corporate** (serves the whole group) and **does not propagate** — the walk stops and returns nothing. Without it, tagging the CEO with every company would make the entire chart match every filter. So tagging a single-company director covers their branch, while the multi-company CEO does not drag unrelated branches in. Someone with no effective company matches only the `SEM_EMPRESA` sentinel, which the Toolbar appends to the filter options as "Sem empresa".

The manager filter lists everyone with `ehGestor` (open positions included, labelled `Vaga: <cargo>`) and matches the selected people plus everything under them via `comDescendentes` in `modelo.js`; the shared ancestor walk then adds the chain above, so the branch keeps its context.

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
