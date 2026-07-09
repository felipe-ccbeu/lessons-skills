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

5. **Transcreva imagens que contêm texto pedagógico, não pule essa etapa.** Muitas aulas
   usam recortes de página de livro didático como imagem — o texto real do exercício
   (o diálogo, a frase-base, o enunciado) frequentemente só existe como pixel dentro
   dessa imagem, não como texto do Slides. `get_page` retorna o `contentUrl` de cada
   imagem; para qualquer imagem que pareça conter texto de exercício (não decorativa —
   fotos de pessoas, ícones e ilustrações puramente visuais não precisam disso), baixe o
   arquivo (`curl`/download para um arquivo temporário) e leia-o com a ferramenta de
   leitura de imagem para transcrever o texto visível. Isso é viável e vale o esforço —
   sem esse passo, exercícios inteiros (frases-base de contração, diálogos com lacuna,
   tabelas de conjugação) ficam invisíveis para a skill de geração de slides, mesmo
   quando o conteúdo é perfeitamente legível na imagem.
   - Pule a transcrição só se a imagem for claramente decorativa (foto de rosto, ícone,
     textura de fundo) — não gaste uma chamada de leitura nessas.
   - Ao transcrever, preserve a estrutura visual (tabela, lista numerada, colunas) em
     Markdown equivalente, não só o texto corrido.

6. **Analisar a didática**, não só o conteúdo. Ao ler os slides e notas, identifique:
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

7. **Produzir o documento de saída** em Markdown com esta estrutura:

   ```markdown
   # <Título da aula>

   ## Metadados
   - Fonte: <URL original>
   - Nº de slides: <n>

   ## Conteúdo por slide
   ### Slide N — <título/tema do slide>
   - Texto do slide: ...
   - Texto transcrito de imagem: ... (marcar claramente como transcrição, ex.:
     "Transcrito da imagem do livro:" seguido do conteúdo — quem ler o documento
     depois precisa saber que essa parte não veio do texto nativo do Slides)
   - Notas do apresentador: ...
   - Elementos visuais: ... (só o que sobrar de puramente visual/decorativo depois
     de transcrever o que tinha texto)

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

8. Salvar o documento como arquivo Markdown (ex.: `<slug-da-aula>.md`) no diretório
   que o usuário indicar (ou perguntar onde salvar, se não tiver sido dito) para que
   a skill de geração de slides (`arrange-lessons`) possa consumi-lo depois.

## Observações

- Esta skill é só leitura/extração — não deve chamar `create_presentation` nem
  `batch_update_presentation`.
- Se a apresentação tiver muitos slides (>30), processe em lotes e avise o usuário
  do progresso, em vez de tentar carregar tudo de uma vez em uma única resposta.
- Não invente conteúdo que não esteja nos slides ou notas; se algo for ambíguo,
  descreva a ambiguidade em vez de assumir. Isso vale igualmente para transcrição de
  imagem: se um trecho estiver ilegível (baixa resolução, cortado, borrado), diga
  isso explicitamente em vez de adivinhar o texto.
- Baixar e ler cada imagem com texto custa uma chamada de ferramenta a mais por
  imagem — para aulas com muitas imagens de livro, isso é o principal custo de tempo
  da extração, mas é o que destrava o conteúdo real dos exercícios. Não pule essa
  etapa para "economizar tempo": o documento de saída fica incompleto de um jeito
  que só aparece depois, na hora de gerar os slides novos.
