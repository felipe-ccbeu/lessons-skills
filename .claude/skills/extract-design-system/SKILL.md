# Extract Design System

Lê os princípios de design usados internamente pela skill `artifact-design` (o
guia de qualidade visual usado para gerar Artifacts) e produz um documento
Markdown de referência: um checklist de design de alta qualidade que a futura
skill de geração de slides deve seguir.

Esta skill **não** extrai uma paleta ou tipografia fixas — `artifact-design` não
tem tokens fixos, é um método: ler o pedido, calibrar o tratamento (utilitário vs.
editorial), e derivar cor/tipografia/layout a partir do assunto específico a cada
uso. O que se documenta aqui é o método e os critérios de qualidade, não valores
de cor prontos.

## Passo a passo

1. **Invocar a skill `artifact-design`** via Skill tool para carregar o conteúdo
   completo do guia nesta conversa.

2. **Ler e organizar os princípios** em categorias:
   - **Calibração de tratamento**: como decidir entre um tratamento utilitário
     (documento, memo, demo — polido mas discreto) e um tratamento editorial
     (landing page, algo que o público vai guardar/compartilhar).
   - **Fundamentos válidos para qualquer artifact**: honrar sistema de design já
     existente, ancorar no assunto (nunca lorem ipsum), pareamento tipográfico,
     neutros escolhidos (não default), suporte a light/dark mode via tokens,
     espaçamento via layout (flex/grid + gap), evitar clichês de "design gerado
     por IA" (lista específica de looks a evitar), construção limpa (sem overlaps,
     fallback de fonte, foco de teclado visível), regras de CSS (especificidade
     de seletores), como escrever a copy (voz ativa, nomear pelo que o usuário
     reconhece), estrutura como informação (numeração só se for sequência real),
     e o tratamento diferenciado quando é UI/dashboard vs. documento.
   - **Processo antes de codar**: esboçar um plano de design compacto (paleta de
     4-6 cores nomeadas, 2+ papéis tipográficos, conceito de layout em 1-2 frases)
     e só depois construir.
   - **Quando o pedido é editorial**: princípios adicionais (hero como tese,
     tipografia com personalidade, uso deliberado de motion, correspondência de
     complexidade com a visão, gastar ousadia em um só lugar).

3. **Produzir o documento de saída** em Markdown com esta estrutura:

   ```markdown
   # Design System — Método de Referência (artifact-design)

   ## Como calibrar o tratamento
   - <critérios para decidir entre utilitário e editorial>

   ## Checklist fundamental (todo slide/artifact)
   - <lista dos fundamentos, cada um como item de checklist acionável>

   ## Processo de design (antes de construir)
   - <passos do sketch de paleta/tipografia/layout>

   ## Quando o material pedir tratamento editorial
   - <princípios adicionais>

   ## Antipadrões a evitar
   - <lista de clichês de "design gerado por IA" a nunca usar por padrão>
   ```

4. Salvar o documento como arquivo Markdown (ex.: `design-system-reference.md`)
   no diretório que o usuário indicar (ou perguntar onde salvar, se não tiver
   sido dito), para servir de segundo insumo — junto ao documento produzido por
   `extract-lesson-slides` — da futura skill que gera novos slides.

## Observações

- Esta skill é só leitura/documentação — não deve gerar HTML, CSS, Artifacts,
  nem chamar `create_presentation`/`batch_update_presentation` do Google Slides.
- Não invente critérios que não estejam no guia `artifact-design`; se algo for
  ambíguo ou parecer specific demais a um caso de uso (web/app) sem aplicação
  clara a slides de aula, sinalize isso no documento em vez de forçar a adaptação.
- Se o guia do `artifact-design` mudar em versões futuras do Claude Code, esta
  skill deve ser re-executada para manter o documento de referência atualizado.
