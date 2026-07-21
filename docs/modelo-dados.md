# Modelo de dados e persistência

Como os dados são estruturados, salvos, versionados e trocados com o mundo externo.
**Os padrões valem para qualquer app sem backend que guarda estado no navegador.**

## Estrutura

```js
dados = {
  version: 2,               // versão do formato (ver aviso abaixo)
  empresa: 'Meu Grupo',     // nome do grupo, exibido no topo
  empresas: [               // cadastro das empresas do grupo
    { id, nome, cor }
  ],
  layoutManual: false,      // false = layout automático
  pessoas: [ /* ver abaixo */ ]
}
```

### Cargo (`pessoa`)

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string | Gerado localmente, único |
| `nome` | string | Vazio só quando `vagaAberta` |
| `cargo` | string | Obrigatório |
| `nivel` | int | 1 = topo |
| `area` / `setor` | string | Livres, podem ficar vazios |
| `descricao` | string | Até 5 linhas |
| `gestorId` | string \| null | `null` = topo |
| `ehGestor` | bool | Ver invariante em [regras-organograma.md](regras-organograma.md) |
| `vagaAberta` | bool | Posição sem titular |
| `empresaIds` | string[] | Vazio = herda do gestor |
| `posicao` | `{x, y}` \| null | Só usado no layout manual |

Ids são gerados combinando timestamp em base 36 com um trecho aleatório — suficiente para uso
local, sem precisar de UUID.

## Persistência

Estado único em um hook (`useOrgChart`), salvo no `localStorage` sob a chave `orga:dados` com
**debounce de 500 ms**, para não gravar a cada tecla digitada. A escrita é protegida por
`try/catch`: se o armazenamento estiver cheio ou indisponível, o app continua funcionando e a
exportação manual segue como saída.

> ⚠️ **Dados no navegador somem com facilidade.** Limpar cache, usar outro navegador, outro
> computador ou uma janela anônima significa começar do zero. Qualquer app assim precisa deixar a
> exportação **visível e insistente** — aqui ela aparece no topo e é um dos passos do tour guiado.

## Duas versões diferentes (não confundir)

| | Onde fica | Muda quando | Afeta os dados? |
|---|---|---|---|
| **Versão do app** | `version` no `package.json`, exibida no topo da tela | A cada release (1.5.1 → 1.6) | **Não.** Nunca. |
| **Versão do formato** | `CURRENT_VERSION` em `modelo.js` | Só quando a estrutura dos dados muda | Sim — dispara migração |

Publicar uma versão nova do aplicativo **não mexe no organograma de ninguém**. O app só avisa
"aplicativo atualizado" (comparando com a chave `orga:versao-vista`) e segue com os mesmos dados.

Só a versão do formato importa para os dados, e mesmo ela **migra em vez de apagar** — ver abaixo.

## Versionamento do formato

`CURRENT_VERSION` é declarada **em um único lugar** (`modelo.js`) e importada por quem precisa.

> ⚠️ **Nunca repita esse número.** Ele já esteve duplicado em três arquivos, e a consequência era
> silenciosa e destrutiva: subir a constante esquecendo o literal da importação fazia todo arquivo
> importado ser salvo com uma versão que o carregamento não reconhecia — o import parecia
> funcionar e os dados sumiam no recarregamento seguinte.

O carregamento chama `migrarDados`, que:

1. Trata a ausência do campo `version` como formato inicial (v1).
2. Traz versões anteriores para o formato atual (as mudanças foram aditivas, então os
   normalizadores preenchem os padrões).
3. Devolve `null` só quando é impossível aproveitar: estrutura inválida ou versão **mais nova** que
   a build atual.

**Nada é apagado em nenhum caso.** Quando `migrarDados` devolve `null`, o conteúdo bruto é copiado
para uma chave `orga:backup:<timestamp>` e a interface mostra um aviso com a opção de baixar o
backup antes de descartar. Uma regra simples sustenta isso: *o app nunca chama `removeItem` em
dados do usuário.*

Ao mudar o formato de verdade: suba `CURRENT_VERSION` **e** adicione o passo correspondente em
`migrarDados`. Como o número tem fonte única, não há nada para sincronizar.

**Prefira sempre mudanças aditivas** — campo novo com padrão dado pelos normalizadores. Foi assim
que o cadastro de empresas entrou sem tocar na versão nem perder dados de quem já usava.

## Normalizadores

Duas funções puras rodam **ao carregar e ao importar**, garantindo que dados de qualquer origem
cheguem coerentes ao estado:

- **`normalizarGestores`** — força `ehGestor: true` em quem é referenciado como gestor de alguém.
- **`normalizarEmpresas`** — garante `empresas` como lista e `empresaIds` em todo cargo, e
  **descarta ids que apontem para empresas inexistentes**.

O ganho é que os dados **se auto-curam**: um arquivo editado à mão, um estado salvo por uma versão
antiga do app ou um bug passado se corrigem sozinhos ao carregar, em vez de contaminar a interface.

**Padrão a levar para outros projetos:** centralize as invariantes em normalizadores puros e
execute-os em *todo* ponto de entrada de dados. Nunca confie no que veio do armazenamento.

## Exportação e importação

O arquivo é o objeto `dados` serializado, mais dois metadados que ajudam a identificar sua origem:

```jsonc
{
  "version": 2,                              // formato dos dados — usado na migração
  "appVersion": "0.1.0",                     // app que gerou o arquivo — informativo
  "exportadoEm": "2026-07-21T12:36:04.969Z", // quando foi gerado — informativo
  "empresa": "...", "empresas": [], "pessoas": []
}
```

Os dois metadados **não voltam para o estado** ao importar: a validação monta o objeto campo a
campo, então qualquer coisa fora do modelo é descartada. Servem para saber, olhando um arquivo
antigo, qual build o produziu e quando.

A validação é o **único portão** para dados externos e rejeita o arquivo inteiro (com mensagem em
português explicando o motivo) quando encontra:

- JSON inválido ou sem a lista `pessoas`
- Cargo sem `id`, `nome` (exceto vaga em aberto), `cargo` ou com `nivel` inválido
- `id` duplicado — de cargo ou de empresa
- `gestorId` apontando para alguém que não existe
- Alguém como gestor de si mesmo
- **Ciclo na hierarquia**

Campos desconhecidos são ignorados e campos ausentes ganham padrão, o que mantém arquivos antigos
compatíveis. Depois da validação, os normalizadores rodam antes de o dado chegar ao estado.

**Padrão a levar:** validação tudo-ou-nada com mensagem específica. Importar pela metade deixa o
usuário num estado que ele não consegue explicar nem desfazer.

## Estado que não é persistido

Filtros, alternância de etiquetas e afins são **estado de visualização** e vivem apenas em
`useState` no componente raiz — nunca vão para o `localStorage` nem para o arquivo exportado.

A separação importa: abrir o app deve mostrar o organograma inteiro, não a última visão filtrada
de semanas atrás. E um arquivo exportado precisa conter todos os cargos, independentemente do que
estava filtrado na tela na hora da exportação.
