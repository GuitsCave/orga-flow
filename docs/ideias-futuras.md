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

## Reconsiderar exportação estática (PDF/PNG) — 💭 EM ABERTO

O doc de redesign propõe **não ter** export estático, para forçar uso ao vivo em
reunião. A ressalva: um comitê executivo tende a pedir o PNG para colar no slide,
então a ausência pode virar **atrito**, não diferencial.

- **Decisão pendente:** manter a tese "só ao vivo" ou oferecer um export simples
  (PNG do canvas) como escape.
- **Se formos implementar:** o Modo Foco (item 2 do plano) já entrega boa parte
  do valor "apresentação" sem export; export de imagem pode ser um extra opcional
  em vez de estratégia central.
- **Fonte:** seção 5 de [design-header-futuro.md](design-header-futuro.md).
