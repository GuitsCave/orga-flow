# Tecnologias

Stack usada no Orga, o motivo de cada escolha e as armadilhas encontradas na prática.
**Reaproveitável em qualquer app React + Vite + Tailwind, com ou sem diagramas.**

## Resumo

| Pacote | Versão | Papel |
|---|---|---|
| `react` / `react-dom` | ^18.3.1 | Base da interface |
| `vite` | ^6.2.0 | Dev server e build |
| `@vitejs/plugin-react` | ^4.3.4 | JSX + Fast Refresh |
| `tailwindcss` + `@tailwindcss/vite` | ^4.0.9 | Estilos utilitários |
| `@xyflow/react` (React Flow) | ^12.4.4 | Canvas de nós e conexões |
| `lucide-react` | ^0.474.0 | Ícones |

```
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção em dist/
npm run preview   # serve o build para conferência
```

Não há backend, banco de dados, roteador, gerenciador de estado externo, suíte de testes nem linter.
Foi uma decisão consciente: o app é de tela única e o estado cabe em um hook.

---

## Vite

Escolhido pelo start instantâneo e pelo Fast Refresh. A configuração inteira é
[`vite.config.js`](../vite.config.js) com dois plugins (React e Tailwind) — nada além disso.

> ⚠️ **Fast Refresh e hooks.** Ao **adicionar ou remover um hook** de um componente/hook customizado
> com a página aberta, o React quebra com *"change in the order of Hooks"* e a tela pode ficar em
> branco. Não é bug do seu código: é o Fast Refresh tentando preservar o estado de uma versão que
> não existe mais. **Um recarregamento completo (Ctrl+F5) resolve.** Antes de caçar o problema,
> recarregue e rode `npm run build` para confirmar que compila.

## Tailwind CSS v4

A v4 mudou bastante em relação à v3:

- **Não existe `tailwind.config.js`.** A configuração vive no CSS.
- Instala-se como **plugin do Vite** (`@tailwindcss/vite`), não como plugin do PostCSS.
- O CSS começa com `@import 'tailwindcss'` (não mais as três diretivas `@tailwind`).
- Os tokens do tema são declarados com **`@theme`** dentro do CSS e viram variáveis CSS
  automaticamente. Em [`src/index.css`](../src/index.css):

```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --color-brand-600: #2563eb;   /* vira a classe bg-brand-600, text-brand-600... */
  --color-nivel-1: #1e3a5f;
}
```

Declarar `--color-brand-600` cria as classes `bg-brand-600`, `text-brand-600`, `ring-brand-600` etc.
**Trocar a identidade visual do app inteiro é editar esse bloco** — nenhuma cor fica espalhada
pelos componentes.

Para cores que precisam ser escolhidas em tempo de execução (a cor de cada empresa, por exemplo),
Tailwind não serve, porque as classes são geradas na compilação. Nesses casos use `style` inline:

```jsx
<span style={{ backgroundColor: empresa.cor }} />
```

## React Flow (`@xyflow/react`)

Usado para o canvas: nós arrastáveis, zoom, pan, minimapa e conexões. O pacote mudou de nome
(`reactflow` → `@xyflow/react`) na v12; tutoriais antigos usam o import velho.

Essencial:

- Importar o CSS: `@import '@xyflow/react/dist/style.css'`.
- Envolver em `<ReactFlowProvider>` para poder usar hooks como `useReactFlow()` (usado aqui para
  o `fitView`).
- Nós customizados recebem `data` e `selected`, e precisam de `<Handle>` para as conexões
  encostarem no lugar certo.

> ⚠️ **`nodeTypes` e `edgeTypes` precisam ser constantes de módulo.** Se forem criados dentro do
> componente, o React Flow recria todos os nós a cada render e avisa no console.
> ```jsx
> const nodeTypes = { pessoa: PessoaNode }   // fora do componente
> ```

> ⚠️ **Callbacks injetados em `node.data` precisam ser estáveis.** Para passar uma função ao nó
> (ex.: o botão "+" que cria um subordinado), ela vai dentro de `data`. Se essa função for recriada
> a cada render, o array de nós muda de identidade, o React Flow remonta tudo e **a seleção do nó
> se perde** — no Orga isso fazia o contorno de seleção sumir sozinho. A correção é envolver em
> `useCallback` com dependências vazias no componente pai e incluí-la no `useMemo` que monta os nós.
> Ver [`src/App.jsx`](../src/App.jsx) (`addSubordinado`) e [`src/components/OrgCanvas.jsx`](../src/components/OrgCanvas.jsx).

Sobre estilos de conexão: `smoothstep` (linhas em 90°) combina com layouts em grade; `default`
(bezier) e conexões retas funcionam melhor quando os nós ficam em posições livres. No Orga
testamos os três e ficamos no `smoothstep` — as curvas ficavam feias quando os blocos estavam
próximos ou lado a lado.

## Layout próprio (sem biblioteca)

O projeto já usou o `@dagrejs/dagre`, mas a dependência foi removida: o layout é calculado à mão
em `src/lib/layout.js`. Vale registrar o porquê, porque a troca não foi capricho.

Uma biblioteca de layout de grafos posiciona nós nos dois eixos a partir das arestas. Aqui o **Y
não pode vir do grafo** — ele vem do campo `nivel` do cargo (ver
[regras-organograma.md](regras-organograma.md)). Sobrescrever o Y devolvido pela biblioteca
funciona, mas ela não sabe disso e passa a gerar sobreposições que exigem um passe corretivo
próprio. Ou seja: metade do resultado era descartado e a outra metade precisava de conserto.

A recursão própria é simples e resolve o caso de árvore:

```js
function layoutNode(id) {
  const filhos = filhosDe.get(id) ?? []
  if (!filhos.length) return { x: 0, width: NODE_WIDTH, subposicoes: { [id]: 0 } }
  // empilha os filhos lado a lado, centraliza o pai sobre eles
  // e devolve as posições relativas de toda a subárvore
}
```

Ganhos concretos: **a ordem dos irmãos passa a ser controlável** (é a ordem do array `pessoas`, o
que permitiu o "mover para a esquerda/direita"), o pacote saiu do bundle e o módulo ficou sem
dependência externa — dá para testar direto no Node.

> ⚠️ Layout recursivo **precisa de rede de segurança contra ciclo**. Com um ciclo na hierarquia
> ninguém é raiz, a recursão não alcança esses nós e eles ficariam sem posição — o React Flow
> quebra ao receber `position: undefined`. O passe final em `calcularLayout` garante uma posição
> para todo mundo.

## lucide-react

Ícones em SVG, importados individualmente (`import { Plus } from 'lucide-react'`), então só entra
no bundle o que é usado. Tamanho via `size={16}`, cor herdada do texto via `currentColor`.

## Sem suíte de testes: como verificar

Não há Vitest/Jest configurado. Duas estratégias cobriram bem:

1. **Lógica pura em módulos sem React.** Tudo que é regra de negócio vive em `src/lib/*.js`, sem
   importar React nem tocar no DOM. Isso permite testar direto com o Node, sem nenhuma
   configuração:
   ```bash
   node --input-type=module -e "import { f } from 'file:///C:/caminho/src/lib/arquivo.js'; ..."
   ```
   Foi assim que validamos ciclos na hierarquia, herança de empresa e o layout.
2. **`npm run build`** como checagem de compilação — pega import quebrado, JSX inválido e afins.

**Vale manter essa separação em qualquer projeto:** regra de negócio em módulo puro, componente só
com apresentação. Torna a verificação barata mesmo sem infraestrutura de teste.
