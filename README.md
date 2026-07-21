# Orga — Organograma Empresarial

<div align="center">
  
  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat-square&logo=react&logoColor=%2361DAFB)
  ![XYFlow](https://img.shields.io/badge/xyflow-%23FF4081.svg?style=flat-square&logo=reactflow&logoColor=white)
  ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat-square&logo=vite&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)
  ![Status](https://img.shields.io/badge/sistema-operacional-emerald?style=flat-square)

</div>

O **Orga** é uma aplicação web moderna e intuitiva projetada para a criação, visualização e reestruturação de organogramas empresariais. Utilizando um canvas de alta performance baseado no React Flow (XY Flow), o Orga permite desenhar hierarquias complexas de cargos, gerenciar equipes em tempo real e aplicar regras estruturais de forma nativa e automática.

---

## ✨ Principais Funcionalidades

### 📊 Visualização e Edição Avançada
- **Canvas Interativo**: Zoom suave, arraste de tela, centralização automática e minimapa de navegação rápida.
- **Painel Lateral**: Edição simples de informações detalhadas como nome, cargo, nível hierárquico, área, setor, descrição do cargo e vínculos a empresas do grupo.
- **Vagas em Aberto**: Cadastro rápido de vagas de cargos sem titular preenchido, marcadas de forma pontilhada no organograma.
- **Indicador de Status Pulsante**: Um indicador de status ativo no header ao lado da versão sinaliza o funcionamento contínuo do sistema.

### 📐 Layout Inteligente por Colunas
- **Distribuição Livre de Sobreposição**: Substitui algoritmos de grafos tradicionais por um layout de árvore personalizado baseado em bounding-boxes (colunas) por nível.
- **Isolamento de Equipes**: Garante que cada time ou gestor reserve seu próprio canal horizontal exclusivo. Os subordinados de equipes adjacentes nunca se sobrepõem ou escorregam por baixo de outros gestores, evitando qualquer cruzamento de linhas.
- **Centralização Automática**: Alinhamento inteligente de gestores centralizados acima da distribuição horizontal das suas respectivas equipes.

### 🎛️ Reordenação Horizontal por Menu de Contexto
- **Ordenação Sob Demanda**: Ao clicar com o botão direito sobre um bloco, as opções **Mover para a esquerda** e **Mover para a direita** são exibidas de forma inteligente.
- **Persistência**: Troca de posição de blocos irmãos no array de dados do projeto de forma nativa, atualizando o layout automático instantaneamente na tela.
- **Validação de Bordas**: Os botões desabilitam-se automaticamente se o bloco selecionado já for o primeiro ou o último entre seus irmãos.

### ⚡ Ajuste Inteligente de Nível Hierárquico
- **Nível do Bloco (Subir/Descer)**: Altera a linha hierárquica apenas do bloco clicado. O aplicativo valida em tempo real para impedir que o cargo suba além do nível do seu gestor direto ou desça abaixo do nível dos seus subordinados.
- **Nível da Equipe (Subir/Descer) [Apenas Gestores]**: Altera o nível do gestor selecionado e de **toda a sua equipe (descendentes)** simultaneamente por 1 nível. Perfeito para inserir novas camadas de gerência intermediárias sem ter que editar cada bloco individualmente.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias modernas e eficientes no desenvolvimento front-end:

- **React 18**: Biblioteca base para a renderização reativa dos componentes.
- **Vite 6**: Bundler e ambiente de desenvolvimento rápido.
- **@xyflow/react (React Flow)**: Biblioteca especializada na renderização de canvas de nós interativos e conexões dinâmicas.
- **Tailwind CSS v4**: Framework CSS para estilização moderna e design responsivo baseado em classes utilitárias.
- **Lucide React**: Biblioteca de ícones modernos e minimalistas.

---

## 🚀 Como Executar o Projeto

Certifique-se de ter o **Node.js** instalado em sua máquina (recomendado versão 18 ou superior).

1. **Instale as dependências**:
   ```bash
   npm install
   ```

2. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Acesse no navegador**:
   Abra a URL padrão [http://localhost:5173/](http://localhost:5173/) para usar o aplicativo.

4. **Compilar para produção**:
   ```bash
   npm run build
   ```

---

## 📁 Estrutura de Diretórios

```text
Orga/
├── dist/                # Pasta com a build de produção compilada
├── docs/                # Documentações e padrões do sistema
│   ├── modelo-dados.md  # Detalhes do modelo e exportações
│   ├── padroes-ui.md    # Cores, fontes e guias de estilo
│   └── regras-organograma.md # Regras de validação de negócios
├── src/
│   ├── components/      # Componentes de interface do usuário
│   │   ├── OrgCanvas.jsx    # Canvas do React Flow e menu de contexto
│   │   ├── PessoaForm.jsx   # Formulário lateral de edição
│   │   ├── PessoaNode.jsx   # Card de renderização de cada bloco
│   │   └── Toolbar.jsx      # Barra de ferramentas e filtros
│   ├── data/            # Dados estáticos (exemplo padrão)
│   ├── hooks/           # Hooks customizados para gerenciamento de estado
│   │   └── useOrgChart.js   # Estado do organograma, backups e localStorage
│   ├── lib/             # Módulos de lógica puras (lógica de negócios)
│   │   ├── layout.js        # Algoritmo de posicionamento por colunas
│   │   └── modelo.js        # Migrações, relacionamentos e validações
│   ├── index.css        # Importações globais do Tailwind v4
│   └── main.jsx         # Ponto de entrada do React
├── vite.config.js       # Configurações do Vite
└── package.json         # Scripts e dependências
```

## 🤖 Créditos e Desenvolvimento

Este projeto foi idealizado e desenvolvido por **Luiz Guilherme Batista ([Guitstech](https://guitstech.com.br/))** em colaboração (pair programming) com as inteligências artificiais **Antigravity** (Google DeepMind) e **Claude** (Anthropic).

