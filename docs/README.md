# Base de conhecimento — Orga

Documentação temática do projeto, separada por assunto para poder ser **reaproveitada em outros projetos**.
A ideia é que cada arquivo seja autossuficiente: dá para copiar só um deles para um projeto novo
(ou colar como contexto para uma IA) sem precisar levar o resto junto.

| Arquivo | Assunto | Reaproveitável? |
|---|---|---|
| [tecnologias.md](tecnologias.md) | Stack, por que cada escolha, configuração e armadilhas | **Alto** — serve para qualquer app React + Vite + Tailwind + React Flow |
| [padroes-ui.md](padroes-ui.md) | Padrões de interface e convenções visuais | **Alto** — independe do domínio |
| [regras-organograma.md](regras-organograma.md) | Regras de negócio do organograma | **Médio** — serve para qualquer ferramenta de organograma |
| [modelo-dados.md](modelo-dados.md) | Modelo de dados, persistência, versionamento e import/export | **Médio** — os padrões valem para qualquer app sem backend |

## Como isso se relaciona com o CLAUDE.md

O [`CLAUDE.md`](../CLAUDE.md) na raiz é o **manual de operação deste repositório** — ele é lido
automaticamente pelo Claude Code e descreve a arquitetura concreta (quais arquivos fazem o quê,
onde estão as invariantes, o que não pode quebrar). Ele é específico do Orga e não faz sentido
levar para outro projeto.

Os arquivos desta pasta são o oposto: são **conhecimento temático**, escritos para durar além
deste repositório.

## Convenções

- Escritos em **português (pt-BR)**, igual ao restante do código, comentários e interface.
- Quando citam código, apontam o caminho do arquivo para poder conferir a fonte.
- Trechos marcados com **⚠️** são armadilhas que já causaram problema de verdade neste projeto —
  são a parte mais valiosa para reaproveitar.
