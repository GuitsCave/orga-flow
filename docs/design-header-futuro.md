# Proposta de Redesign da Interface: Header Flutuante & Zen Canvas

Documento conceitual com a proposta de redesign da interface do **Orga**, visando um visual extremamente comercial, sofisticado ("sexy") e minimalista, inspirado nos maiores softwares SaaS do mercado (*Figma, Notion, Linear, Miro, Vercel*).

---

## 🎨 Visão Geral do Conceito ("Zen Canvas")

A premissa central é que **o organograma em si é o protagonista da aplicação**. As barras de ferramentas e navegações devem ser discretas, flutuantes e organizadas, sem disputar espaço visual com os blocos e conexões.

---

## 🏛️ Arquitetura e Anatomia da Nova Interface

### 1. 🪟 Header Flutuante com Glassmorphism (Top Dock)
Em substituição à barra retangular contínua no topo, a navegação principal se torna uma **dock flutuante suspensa** com cantos arredondados, fundo borrado translúcido (`backdrop-blur`) e sombra suave:

* **Zona Esquerda (Identidade & Contexto)**:
  * Logo `Orga` minimalista.
  * Seletor compacto de cenários `[ 🌳 Cenários (N) ▾ ]`.
  * Nome do Grupo / Empresa editável.
* **Zona Central (Modos de Visão)**:
  * Pílula de alternância rápida: `[ 🌳 Organograma | 📋 Tabela | 📇 Cartões ]`.
* **Zona Direita (Ações e Configurações)**:
  * Botão de Destaque Primário `+ Adicionar`.
  * Ícone discreto de Menu de Configurações `⚙️` ou `☰`.

---

### 2. 🍔 Side Drawer (Menu Lateral Retrátil de Gestão)
Para despoluir a barra principal, as funcionalidades administrativas e secundárias são movidas para uma barra lateral deslizante (*Side Drawer*) ativada ao clicar na engrenagem/menu do header:

* **Conteúdo do Menu Lateral**:
  * 📁 **Gerenciador de Arquivos**: Exportar JSON, Importar JSON e Restaurar Backups.
  * 🏢 **Cadastro do Grupo**: Cadastro e reordenação de Empresas do Grupo.
  * ❓ **Ajuda e Padrões**: Tour guiado,atalhos de teclado e versão do aplicativo.

---

### 3. 🎯 HUD Flutuante no Rodapé (Footer Status Bar)
As informações operacionais e contadores são relocalizados para uma pequena pílula flutuante no rodapé da tela:

* **Contadores de Headcount**: `42 cargos · 5 gestores · 3 vagas`.
* **Controles do Canvas**: Porcentagem de Zoom, Recentralizar, Alternador `Manual vs. Automático`.

---

### 4. ⚡ Command Palette (`Ctrl + K` / `Cmd + K`)
Introdução de um menu de comandos e busca rápida no centro da tela acionado via teclado:

* Permite buscar qualquer colaborador ou cargo digitando.
* Permite executar ações sem clicar na interface (ex: *"Trocar para Cenário B"*, *"Exportar para Excel"*, *"Cadastrar Empresa"*).

---

### 5. 🎥 Modo Foco & Apresentação Interativa Ao Vivo (Live Meeting Mode)
* **Estratégia de Produto**: **Sem exportação estática (PDF/PNG)**. O produto é projetado intencionalmente para forçar o uso ao vivo durante reuniões e comitês executivos.
* **Recursos de Apresentação em Reunião**:
  * **Modo Foco / Tela Cheia Limpa (`F`)**: Oculta 100% da interface do navegador e botões, deixando apenas o canvas interativo responsivo em foco na reunião.
  * **Simulação de Cenários ao Vivo**: Em vez de poluir com tags de projetos, o usuário utiliza o **Gerenciador de Cenários** para alternar entre a "Estrutura Atual", "Cenário Squad Alpha" ou "Reestruturação Q4" durante a reunião em tempo real.
  * **Modo Confidencial (Anonimizador)**: Mascara nomes sensíveis em 1 clique quando a reunião inclui terceiros ou consultores externos.

---

### 6. 📇 Módulo Complementar (Plus): Ficha de Perfil Enriquecida & Avatares
* **Conceito de Produto**: Recursos **opcionais / complementares** que não poluem o cadastro essencial do organograma, mas agregam alto valor para quem usa a visão em Cartões ou Ficha de RH.
* **Campos Opcionais (Plus)**:
  * Avatar / Foto (com compressão em tempo real em WebP ~5KB via Canvas).
  * E-mail e contato interno de rede.
  * Habilidades (Skills) e Bio/Descrição do cargo.
* **Modal de Perfil Expandido**: Ao dar duplo-clique em um nó (ou na visão em Cartões), abre a ficha completa sem sobrecarregar a visualização padrão de árvore.

---

## 🗺️ Fases Recomendadas para Implementação Futura

1. **Fase 1**: Reestruturar a Toolbar em uma Dock Flutuante com efeito Glassmorphism.
2. **Fase 2**: Criar o *Side Drawer* (painel de configurações lateral) para acomodar a gestão de arquivos, empresas e backups.
3. **Fase 3**: Mover as estatísticas e controles de zoom para o HUD no rodapé.
4. **Fase 4**: Implementar o Command Palette (`Ctrl + K`).
5. **Fase 5**: Implementar o Modo Apresentação Interativo Ao Vivo (Live Meeting Mode).
6. **Fase 6 (Módulo Plus)**: Implementar Ficha de Perfil Enriquecida com Fotos/Avatares em WebP.
