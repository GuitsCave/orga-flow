# Padrões de interface

Convenções visuais e de interação adotadas no Orga, com o motivo de cada uma.
**Reaproveitável em qualquer app — não depende do domínio de organograma.**

## Idioma e nomenclatura

Interface, nomes de variáveis, props, funções e comentários **em português (pt-BR)**.
`salvarPessoa`, `filtroEmpresas`, `onFechar` — sem misturar inglês no meio.

Manter uma língua só evita o vaivém mental de `handleSubmit` conviver com `salvarPessoa`, e
aproxima o código do vocabulário de quem usa o sistema.

## Cores

Todas as cores saem dos tokens `@theme` no CSS (ver [tecnologias.md](tecnologias.md)).
Nenhum componente inventa cor própria — trocar a identidade visual é editar um bloco só.

Exceção legítima: cores escolhidas pelo usuário em tempo de execução (a cor de cada empresa), que
vão em `style` inline porque o Tailwind gera classes na compilação.

## Cabeçalho em duas faixas

O cabeçalho separa **o que você faz** de **o que você vê**:

1. **Barra do app** (fundo branco): identidade, nome do grupo, ação primária destacada, ações
   secundárias, e por último as de arquivo como ícones discretos.
2. **Barra de filtros** (faixa cinza clara): os filtros, opções de exibição, um botão de limpar e
   um contador de resultados.

Antes tudo ficava numa linha só e, com o crescimento das funcionalidades, os botões começaram a
quebrar para uma segunda linha de forma desorganizada, misturando "exportar" com "filtrar por
setor". A separação por natureza da ação resolveu — e a faixa cinza sinaliza sem precisar de
título que aquilo é um grupo diferente.

Regras que sustentam o padrão:

- **Ação primária única e colorida** por tela; o resto em cinza neutro.
- **Rótulos secundários recolhem para só ícone** em telas menores (`hidden lg:inline`), mantendo a
  primeira faixa sempre em uma linha.
- Filtro ativo fica **visualmente destacado** (fundo e borda na cor da marca) — sem isso o usuário
  esquece que filtrou e acha que perdeu dados.
- **Contador de resultados** ("10 de 15 cargos") como feedback de quanto está oculto.

## Seleção múltipla em dropdown

Um componente único (`MultiSelect`) atende tanto os filtros do cabeçalho quanto campos de
formulário, alternando por uma prop entre o gatilho compacto e o de largura total.

Decisões embutidas:

- **Lista sempre fechada por padrão.** No formulário, uma lista de checkboxes aberta crescia
  conforme se cadastravam empresas e **empurrava o botão de salvar para fora da tela**.
- **Campo de busca em todos os dropdowns**, com foco automático ao abrir, ignorando acentos e
  maiúsculas ("logistica" encontra "Logística") e comparando contra o **rótulo exibido** — o que
  permite filtrar por nome opções cujo valor é um id.
- **Esc fecha e limpa** a busca; clique fora fecha.
- Estado vazio explícito ("Nenhum resultado para ...") em vez de lista vazia.

## Painel lateral de cadastro

Formulário em painel lateral, não em modal, para o usuário continuar vendo o organograma enquanto
edita.

- **Rodapé fixo** com as ações: só a área de campos rola. Salvar nunca fica fora do alcance,
  mesmo em telas baixas.
- **Mensagem de erro junto dos botões**, não no topo — o erro aparece ao tentar salvar, e o
  usuário está olhando para o botão nesse momento.
- **Ação destrutiva (excluir) visualmente distinta**: contorno vermelho, sem preenchimento, abaixo
  da ação principal.

## Densidade e quebra de texto

Espaço em painel estreito é escasso. Regras aplicadas:

- Rótulos de campo com `whitespace-nowrap` — quebrar "É gestor(a)?" em duas linhas fica feio e
  aumenta a altura do formulário sem necessidade.
- **Explicações longas vão para `title` (tooltip)**, não para o layout. Fica visível só a
  informação curta e útil ("3 subordinados", "Sem titular").
- Campos lado a lado recebem **larguras proporcionais ao conteúdo**, não metade cada: um campo
  numérico de um dígito ao lado de um seletor de nomes usa uma grade de 3 colunas (1 + 2), não
  duas colunas iguais.
- Textos longos com `truncate` ou `line-clamp`, com o conteúdo completo no tooltip.

## Menu de contexto no próprio objeto

Ações que agem sobre **um item específico** ficam no botão direito daquele item, não na barra
superior: reordenar, isolar, mudar nível. A barra fica só com o que é global.

O critério é o alcance da ação. Jogar tudo na barra obriga a inventar um "item selecionado"
implícito e faz o usuário mirar longe do objeto que quer mudar.

Duas regras que o menu segue:

- **Itens impossíveis aparecem desabilitados, não somem.** Um menu que muda de tamanho a cada
  abertura obriga a reprocurar a opção; desabilitado ensina qual é o limite (o primeiro irmão não
  pode ir mais para a esquerda).
- **Reposiciona-se para caber na tela** — perto do cursor, mas deslocado quando estouraria a borda
  direita ou inferior.

> ⚠️ Quando o menu desabilita um botão a partir de uma regra, essa regra passa a existir em dois
> lugares: no menu e em quem aplica a mudança. Se as duas versões divergirem, o botão fica
> habilitado e a ação não acontece — falha silenciosa, difícil de perceber.

## Confirmação de exclusão embutida

Excluir pede confirmação **no próprio lugar** (a linha se expande mostrando a pergunta e o impacto
— "o vínculo será removido de 3 cargos"), em vez de abrir outro modal.

Menos interrupção, e a confirmação carrega a informação que realmente importa: a consequência.

## Tour de primeiro uso

Passo a passo com máscara escurecendo a tela e recorte iluminando o elemento da vez.

- Abre **sozinho no primeiro acesso**, controlado por uma chave própria no `localStorage` —
  **separada da chave dos dados**, para nunca interferir no conteúdo do usuário.
- Sempre reabrível por um botão `?` visível.
- Cada passo aponta para um atributo `data-tour` no elemento. **Passo cujo alvo não existe na tela
  é pulado automaticamente**, então o tour não quebra em estados diferentes (organograma vazio,
  filtro ainda sem opções).
- Navegação por teclado (setas e Esc) e opção de pular em todos os passos.

> ⚠️ Acoplamento a vigiar: mover ou renomear um elemento destacado sem atualizar o `data-tour`
> faz o passo **sumir silenciosamente**, sem erro nenhum.

## Estados vazios

Toda área que pode ficar sem conteúdo tem um estado vazio com ícone, explicação e o caminho para
sair dele ("Nenhuma pessoa cadastrada. Clique em Adicionar para começar."), em vez de uma tela em
branco.
