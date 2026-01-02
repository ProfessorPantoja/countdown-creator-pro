# 📘 Relatório Técnico & Core Logic - Countdown Creator Pro

Este documento detalha o que causou os erros recentes e explica a arquitetura central do aplicativo para facilitar a continuidade do desenvolvimento.

---

## 1. O Que Aconteceu? (Post-Mortem dos Erros)

**O Pedido Inicial:**
Você solicitou a adição de dois botões na seção de Fundo:
1.  **"Resetar Posição"** (para centralizar mídia).
2.  **"Deletar Mídia"** (para remover imagem/vídeo e voltar ao gradiente).

**A Causa Técnica do Erro (`BackgroundSection.tsx`):**
Ao tentar adicionar essas funcionalidades rapidamente, cometi um erro de estruturação no código React:
*   Eu defini as funções de lógica (`handleResetPosition` e `handleDeleteMedia`) **DENTRO** do bloco visual (o HTML/JSX), especificamente dentro do `return (...)`.
*   Em React/JavaScript, isso é proibido. Funções devem ficar no "corpo" do componente, antes do `return`.

**O Efeito Cascata:**
1.  O compilador (Vercel) encontrou código lógico misturado com código visual e quebrou (Tela Vermelha).
2.  Nas tentativas subsequentes de correção rápida, restos de código (chaves `}` e parênteses `)`) ficaram perdidos no arquivo, impedindo que o compilador entendesse onde o arquivo começava ou terminava.
3.  **Solução Final (Revert):** Voltamos o código para um ponto seguro antes dessas edições, garantindo estabilidade.

---

## 2. A Lógica do "CORE" (Como o App Funciona)

O Countdown Creator Pro não é apenas um gravador de tela. Ele é um **Gerador de Vídeo Programático**.

### 🏗️ Arquitetura Principal

O app é dividido em 3 pilares controlados pelo `App.tsx`:

#### A. O Cérebro (`App.tsx` & State)
Existe um objeto gigante chamado `appearance` (Estado de Aparência) que guarda **absolutamente tudo**:
*   Cores, Fontes, Tamanhos.
*   Posição X/Y de cada elemento.
*   Link do vídeo de fundo, escala, duração.

#### B. O Espelho (`Preview.tsx`)
*   Este componente apenas "ler" o `appearance` e mostra na tela usando HTML/CSS.
*   Ele é **apenas visual**. Se você arrasta um texto no Preview, ele atualiza os números no `appearance`, e o Preview se redesenha instantaneamente.
*   **Performance:** Ele usa truques de CSS (`transform`, `will-change`) para ser rápido e suave.

#### C. O Motor de Fábrica (`VideoRenderer.ts`) - **O CORE**
Aqui está a mágica real. Quando você clica em "Renderizar":
1.  O app **ignora** o que está na tela.
2.  Ele cria um "canvas invisível" na memória.
3.  **Frame a Frame (30 vezes por segundo):**
    *   Ele "pinta" o fundo (cor ou frame exato do vídeo naquela fração de segundo).
    *   Ele desenha o texto do timer matematicamente.
    *   Ele aplica efeitos (sombra, brilho).
    *   Ele tira uma "foto" desse canvas.
4.  **Compilação:** Junta todas as "fotos" e o áudio em um arquivo `.mp4` real.

### 🚀 Por que essa arquitetura é boa?
*   **Independência:** O vídeo sai em HD/4K mesmo se a pessoa estiver no celular com tela pequena.
*   **Precisão:** O timer no vídeo final nunca falha, porque é calculado matematicamente frame a frame, não dependendo da velocidade do navegador do usuário.

---

## 3. Guia para o Próximo Desenvolvedor

Se você abrir um novo chat, entregue este resumo:

> "O projeto é um React App (Vite + Tailwind). O estado central fica em `App.tsx`. O componente visual é `Preview.tsx`. O motor de exportação é `VideoRenderer.ts` (Canvas API pura). O código foi revertido para o commit `431f6f1` (estável). A próxima tarefa pendente é reimplementar com cuidado os botões de 'Reset Position' e 'Delete Media' em `BackgroundSection.tsx` sem quebrar a sintaxe JSX."

---

## 4. Guia de Desenvolvimento Diário (Workflow)

Perguntas Frequentes sobre o fluxo de trabalho (Vite/React):

### 🔄 Quando atualizar o quê?

1.  **Edição de Código (Live):**
    *   **O que acontece:** Você altera um arquivo `.tsx` ou `.css`.
    *   **Ação:** Apenas Salve (Ctrl+S).
    *   **Resultado:** O **HMR (Hot Module Replacement)** atualiza apenas o pedaço que mudou instantaneamente. Não precisa fazer nada.

2.  **Recarregar a Página (F5):**
    *   **Quando usar:** Se você sentir que o app "travou", se o timer ficar negativo de propósito, ou se você quiser limpar os dados de teste da memória (ex: resetar o Auto-Test).
    *   **Por quê:** Garante que o estado da memória (RAM do navegador) comece limpo.

3.  **Reiniciar o Terminal (`npm run dev`):**
    *   **Quando usar:** Apenas quando você modificar arquivos de **Configuração** (`vite.config.ts`, `.env`, `package.json`) ou instalar novas bibliotecas (`npm install`).
    *   **Por quê:** Essas configurações são lidas apenas na hora que o servidor liga.

### 🛡️ Padrão de Segurança (Git)

Para evitar quebrar o que já funciona, adotaremos o seguinte fluxo:

1.  **Coding:** Faço a alteração.
2.  **Testing:** Você testa no Localhost.
3.  **COMMIT (Checkpoint Prata):** Se funcionou, salvamos localmente (`git commit`). Isso cria um ponto de retorno seguro.
4.  **PUSH (Checkpoint Ouro):** Apenas enviamos para a nuvem (GitHub/Deploy) quando um ciclo completo de funcionalidades estiver 100% pronto e estável. Isso evita enviar código quebrado para a produção.
