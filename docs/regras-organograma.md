# Regras do organograma

Regras de negócio da ferramenta, independentes de como a interface foi construída.
**Reaproveitável em qualquer ferramenta de organograma.**

## Conceitos

O organograma é uma lista plana de **cargos** (chamados de `pessoa` no código). A hierarquia não é
uma árvore aninhada: cada cargo guarda apenas o `gestorId` de quem está acima dele. A árvore é
derivada dessas referências.

Essa escolha simplifica quase tudo — mover alguém de chefe é trocar um campo — mas exige cuidado
com três coisas: referências órfãs, ciclos e a coerência entre nível e hierarquia.

## Nível

- Inteiro, **1 = topo**. Quanto maior o número, mais abaixo na hierarquia.
- Serve para **ordenar verticalmente** e para dar a cor de destaque do bloco.
- **O número nunca aparece no bloco.** É organização interna, não informação para quem lê o
  organograma.
- A cadeia de gestores **pode pular níveis**: um cargo de nível 4 pode reportar direto a um de
  nível 2. Isso é comum e legítimo (um analista sênior que responde a um diretor).

## Gestor e subordinado

- `gestorId` aponta para outro cargo, ou é `null` para o topo.
- A flag `ehGestor` controla quem aparece na lista de gestores disponíveis.

**Invariante forte:** quem é referenciado como `gestorId` de alguém **é gestor**, ponto. Mesmo que
o campo tenha sido salvo como `false`, ele é corrigido ao carregar. Sem isso, os dados ficam
inconsistentes: alguém comanda pessoas mas não pode ser escolhido como chefe.

Consequência na interface: a caixa "É gestor(a)?" fica **desabilitada e marcada** quando o cargo
tem subordinados. Para deixar de ser gestor, primeiro é preciso realocar quem responde a ele.

## Validações da hierarquia

Aplicadas ao salvar um cargo:

1. **Não pode desmarcar "é gestor" tendo subordinados** (ver invariante acima).
2. **O gestor precisa estar acima**: `nivel do gestor < nivel do cargo`, estritamente.
3. **O cargo precisa ficar acima dos próprios subordinados**: o nível dele precisa ser menor que o
   menor nível entre seus subordinados. Impede rebaixar um chefe para baixo da equipe dele.
4. **Não pode escolher como gestor um descendente próprio** — isso criaria um ciclo. Verificado
   com uma busca em largura descendo pela hierarquia.

Na importação de arquivo há ainda a detecção de ciclo percorrendo a cadeia para cima com registro
dos visitados; qualquer laço rejeita o arquivo inteiro.

> ⚠️ **Toda travessia da hierarquia precisa de proteção contra ciclo.** Mesmo com as validações,
> um arquivo editado à mão pode conter um laço. Todo `while` que sobe ou desce a árvore neste
> projeto carrega um `Set` de visitados.

## Exclusão

Excluir um cargo **não apaga a subárvore**. Os subordinados são **reatados ao gestor do excluído**
(ou viram topo, se ele era o topo). É o comportamento esperado numa reestruturação: some um nível
intermediário e a equipe sobe.

## Vaga em aberto

Marca uma posição que **existe no organograma mas não tem titular**.

- O nome fica vazio — é o único caso em que nome vazio é válido.
- O bloco é desenhado com borda tracejada e o rótulo "Vaga em aberto".
- Funciona como qualquer outro cargo: tem nível, área, setor, gestor, **pode ser gestora de
  outras pessoas** e entra nos filtros.
- Onde um nome seria exibido (lista de gestores, por exemplo), mostra-se `Vaga: <cargo>`.

## Empresas do grupo

Um grupo empresarial tem várias empresas, e um cargo pode atender **uma, várias ou nenhuma**.

- O cadastro de empresas é uma lista de `{ id, nome, cor }`.
- Cada cargo guarda `empresaIds` (array).
- As etiquetas coloridas no bloco mostram **apenas as empresas marcadas explicitamente**, nunca as
  herdadas — assim dá para ver onde a definição realmente foi feita.

### Herança da empresa

Marcar empresa em todos os cargos é inviável. Então: **quem não tem empresa marcada herda a do
gestor**, subindo a cadeia até encontrar alguém definido.

**Exceção do cargo corporativo:** se o gestor encontrado tem **mais de uma empresa marcada**, ele é
tratado como corporativo (atende o grupo inteiro) e **não propaga nada** — a busca para e o cargo
fica sem empresa efetiva.

Sem essa exceção, marcar o CEO com todas as empresas faria o organograma inteiro pertencer a todas
elas, e o filtro por empresa deixaria de filtrar qualquer coisa. Foi exatamente o que aconteceu na
primeira versão.

Resumindo o efeito prático:

| Situação | Empresa efetiva |
|---|---|
| Cargo com empresa marcada | As dele mesmo |
| Sem marcação, gestor com **uma** empresa | Herda a do gestor |
| Sem marcação, gestor com **duas ou mais** | Nenhuma (o gestor é corporativo) |
| Ninguém na cadeia tem empresa | Nenhuma |

Quem fica sem empresa efetiva só aparece no filtro especial **"Sem empresa"** — útil para
descobrir o que ainda falta classificar.

## Filtros

Todos os filtros são de **múltipla escolha** e **apenas de visualização**: nunca alteram nem
exportam os dados. Sair do filtro traz tudo de volta.

| Filtro | O que faz |
|---|---|
| Empresa | Casa pela **empresa efetiva** (com herança), mais a opção "Sem empresa" |
| Gestor | Mostra os gestores escolhidos **e toda a árvore abaixo deles** |
| Área / Setor | Casa pelo valor exato do campo |
| Nível | Mostra **exatamente** os níveis marcados (não é "até o nível N") |

**Regra comum a todos:** depois de marcar quem casa com o filtro, o sistema **sobe a cadeia de
gestores adicionando todos os ancestrais**. Sem isso o resultado ficaria solto, já que os chefes
normalmente não carregam a área ou o setor dos analistas — filtrar "TI" mostraria os analistas
sem nenhuma ligação visível com o topo.

Como o filtro de nível mostra exatamente os níveis marcados, ele **pode esconder um gestor
intermediário**. Nesse caso a conexão não é descartada: ela é redesenhada até o **ancestral visível
mais próximo**, com traço pontilhado e animado para sinalizar que há um degrau oculto no caminho.

## Layout automático

O ponto central: **a linha de cada bloco é definida pelo nível, não pela profundidade na árvore.**

Um cargo de nível 4 fica na linha do nível 4 mesmo que seu gestor seja de nível 2 — alinhado com
os outros de nível 4, em vez de subir para a linha logo abaixo do chefe. É o que faz o organograma
parecer organizado por camadas hierárquicas reais.

Detalhes da implementação:

- O **X** vem do dagre (ordena horizontalmente e centraliza os pais sobre os filhos).
- O **Y** vem do nível.
- **Níveis totalmente vazios não deixam linha em branco** — as linhas são as dos níveis que
  existem, em ordem.
- Como mover blocos para a linha do nível pode gerar colisão, há um **passe final separando
  horizontalmente** os blocos que se sobrepõem dentro de cada linha.

## Layout manual

Alternativa ao automático: os blocos ficam arrastáveis e a posição de cada um é salva junto com os
dados. Existe uma ação para descartar as posições e voltar ao automático.
