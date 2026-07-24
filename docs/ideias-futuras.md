# Ideias Futuras — Backlog "algum dia"

Itens que **não** estão no plano ativo de redesign
([redesign-plano.md](redesign-plano.md)). Ficam aqui registrados para não se
perderem, mas foram adiados por risco, custo ou por dependerem de decisões que
ainda não queremos tomar.

---

## Módulo Plus: Ficha de Perfil & Avatares — 💤 ADIADO

Fotos/avatares e campos extras de RH (e-mail, skills, bio), com modal de perfil
expandido no duplo-clique do nó.

- **Por que adiado — impacto no storage:** fotos, mesmo comprimidas a ~5KB em
  WebP, num org de ~100 pessoas somam ~500KB dentro do limite de ~5MB do
  `localStorage`, competindo com **todos os cenários e backups**. Isso muda o
  modelo de dados e o orçamento de armazenamento.
- **Pré-requisito antes de implementar:** decidir estratégia de storage —
  provavelmente migrar imagens para **IndexedDB**, mantendo o JSON leve. Só
  depois vale mexer no `PessoaForm`/`PessoaNode`/cartões.
- **Fonte:** seção 6 de [design-header-futuro.md](design-header-futuro.md).

## Exportação estática (PDF/PNG) — ✅ PNG decidido e implementado

O doc de redesign propunha **não ter** export estático, para forçar uso ao vivo em
reunião — mas a ressalva se confirmou: a falta do PNG vira atrito (comitê pede
pra colar no slide), não diferencial. Decisão: manter o Modo Foco como a via
"apresentação ao vivo" e oferecer PNG como escape.

- **Implementado:** "Exportar imagem (PNG)" no `SideDrawer`, seção Arquivo,
  junto ao "Exportar backup (JSON)". Exporta a árvore inteira (não só o que
  está enquadrado na tela) via `getNodesBounds`/`getViewportForBounds` do
  React Flow + `html-to-image`. Reflete exatamente o que está na tela no
  momento — filtros, bloco isolado e nomes mascarados pelo Modo Confidencial
  já vêm prontos nos nós, então a imagem sai coerente com o que o usuário viu
  ao clicar. Só existe na visão Organograma (o botão fica desabilitado com
  dica em Tabela/Cartões, onde não há canvas React Flow montado).
- **PDF:** não implementado. Fica como próximo passo condicional — só faz
  sentido se surgir pedido real de paginação/impressão formal; o PNG já cobre
  o caso de uso principal ("colar no slide").
- **Fonte:** seção 5 de [design-header-futuro.md](design-header-futuro.md).
