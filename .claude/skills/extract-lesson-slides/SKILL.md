---
name: extract-lesson-slides
description: Extrai o conteúdo e a didática de uma aula a partir de uma apresentação do Google Slides (via mcp-server-google-slides), produzindo um documento estruturado em Markdown que serve de insumo para a skill que gera novos slides.
---

# Extract Lesson Slides

Lê uma apresentação do Google Slides através do MCP `google-slides-mcp` e produz um
documento Markdown com (1) o conteúdo da aula e (2) a forma como esse conteúdo é
tratado pedagogicamente (estrutura, progressão, exemplos, tom). Esse documento é o
insumo de uma skill futura que vai gerar novos slides a partir dele.

## Pré-requisitos

- O MCP `google-slides-mcp` (matteoantoci/google-slides-mcp) precisa estar
  conectado e autenticado nesta sessão do Claude (tools com prefixo
  `mcp__google-slides-mcp__*` ou similar). Se as tools não aparecerem disponíveis,
  avise o usuário para configurar o servidor no Claude Desktop/CLI (`GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`) antes de continuar.
- O `presentationId` é o trecho entre `/d/` e `/edit` na URL do Google Slides.
  Ex.: `https://docs.google.com/presentation/d/<presentationId>/edit`.

## Passo a passo

1. **Extrair o ID da apresentação** a partir da URL fornecida pelo usuário.

2. **Obter metadados** com `get_presentation` (presentationId) para saber título,
   número de slides e IDs de cada página (`slides[].objectId`).

3. **Obter o conteúdo textual** com `summarize_presentation`
   (presentationId, `include_notes: true`). Isso traz o texto de cada slide e as
   notas do apresentador — é comum professores usarem as notas para registrar o
   roteiro de fala, perguntas de verificação de aprendizagem, ou instruções de
   atividade que não aparecem no slide visível. Não pule as notas.

4. **Para slides com estrutura visual relevante** (diagramas, disposição em colunas,
   destaque de imagens, ordem de aparição de bullets) que o resumo de texto não capture
   bem, chame `get_page` (presentationId, pageObjectId) para inspecionar os elementos
   da página individualmente (posição, tipo de shape, texto por caixa).

5. **Analisar a didática**, não só o conteúdo. Ao ler os slides e notas, identifique:
   - **Estrutura da aula**: introdução/gancho, desenvolvimento, prática, fechamento/recap.
   - **Progressão**: como um conceito prepara o próximo; se há escalonamento de
     dificuldade.
   - **Técnicas usadas**: perguntas retóricas, exemplos antes da regra (indutivo) vs.
     regra antes do exemplo (dedutivo), analogias, repetição espaçada, checagem de
     compreensão, chamadas para prática ativa.
   - **Tom e voz**: formal/informal, uso de humor, quantidade de texto por slide,
     se os slides são "roteiro completo" ou "apoio visual mínimo" com o conteúdo
     pesado nas notas do apresentador.
   - **Elementos visuais recorrentes**: uso de imagens, ícones, cores para categorizar
     informação, se cada slide segue um template repetido.

6. **Produzir o documento de saída** em Markdown com esta estrutura:

   ```markdown
   # <Título da aula>

   ## Metadados
   - Fonte: <URL original>
   - Nº de slides: <n>

   ## Conteúdo por slide
   ### Slide N — <título/tema do slide>
   - Texto do slide: ...
   - Notas do apresentador: ...
   - Elementos visuais: ...

   (repetir para cada slide, ou agrupar slides que formam um mesmo bloco temático)

   ## Estrutura pedagógica da aula
   - Abertura: ...
   - Desenvolvimento: ...
   - Prática/exemplos: ...
   - Fechamento: ...

   ## Padrões didáticos identificados
   - <lista das técnicas e do porquê elas aparecem onde aparecem>

   ## Estilo e tom
   - <observações sobre voz, densidade de texto, uso de exemplos/analogias>
   ```

7. Salvar o documento como arquivo Markdown (ex.: `<slug-da-aula>.md`) no diretório
   que o usuário indicar (ou perguntar onde salvar, se não tiver sido dito) para que
   a skill de geração de slides (a ser criada depois, usando `mcp-google-slides` para
   escrita) possa consumi-lo depois.

## Observações

- Esta skill é só leitura/extração — não deve chamar `create_presentation` nem
  `batch_update_presentation`.
- Se a apresentação tiver muitos slides (>30), processe em lotes e avise o usuário
  do progresso, em vez de tentar carregar tudo de uma vez em uma única resposta.
- Não invente conteúdo que não esteja nos slides ou notas; se algo for ambíguo,
  descreva a ambiguidade em vez de assumir.
