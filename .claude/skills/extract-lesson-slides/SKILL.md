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

4. **Tire uma screenshot de TODO slide, sempre — não é condicional, não é "quando o
   resumo parecer insuficiente".** Esta é a etapa que existe porque uma falha real
   aconteceu: uma extração inicial usou "o resumo de texto parece completo" como sinal
   de que um slide não precisava de mais investigação, e isso escondeu sistematicamente
   GIFs, balões de fala (`WEDGE_ROUND_RECTANGLE_CALLOUT`), grades de fotos, e mapas com
   marcadores — nenhum desses aparece no texto do resumo (o resumo só lista texto
   nativo de caixas de texto), então um slide com esse conteúdo *parece* ter só o
   título e uma frase, quando na verdade tem uma imagem inteira de conteúdo pedagógico
   por trás. Não existe um sinal barato no `summarize_presentation` que avise "este
   slide tem elementos visuais além do texto" — a única forma confiável de saber é
   olhar o slide renderizado.
   - **Baixe a screenshot pela URL de export do próprio Google Slides**, sem precisar
     do MCP nem do Playwright:
     ```
     https://docs.google.com/presentation/d/<presentationId>/export/png?id=<presentationId>&pageid=<pageObjectId>
     ```
     Isso devolve um PNG renderizado do slide exatamente como aparece no Slides
     (título, texto, imagens, GIFs como frame estático, balões de fala, formas) — uma
     imagem por slide, sem o custo de 60-70KB de JSON que `get_page` traz. Baixe com
     `curl`/download para um arquivo temporário e leia com a ferramenta de leitura de
     imagem.
   - **Leia a screenshot e documente o conteúdo diretamente dela sempre que possível —
     isso é a norma, não a exceção.** A screenshot já mostra texto de corpo normal,
     GIFs, balões de fala, e a estrutura geral (mapa, grade de fotos, tabela). Na
     maioria dos casos isso basta para documentar o slide por completo, sem precisar
     de mais nenhuma chamada. `get_page` é cara (ver abaixo) — trate-a como último
     recurso, não como o próximo passo automático depois de toda screenshot.

5. **Só chame `get_page` (presentationId, pageObjectId) quando a screenshot sozinha
   genuinamente não resolver** — na prática, isso significa um destes casos
   específicos, não "a screenshot tem uma imagem":
   - **Texto realmente ilegível na resolução da screenshot** (rótulo pequeno num mapa,
     legenda minúscula) — e mesmo aqui, tente primeiro reler a screenshot em zoom antes
     de chamar `get_page`; só escale se o texto continuar ilegível.
   - **Você precisa da imagem em resolução total para transcrever texto pequeno dentro
     dela** — nesse caso, `get_page` serve só para pegar o `contentUrl` daquela imagem
     específica, não para reconstituir o slide inteiro. Baixe só a imagem, não use o
     resto do JSON.
   - **Você precisa confirmar se um GIF é decorativo ou pedagógico** e a screenshot não
     deixa claro — `get_page` traz `sourceUrl`/`imageProperties.link.url`, que costuma
     resolver isso rápido (um link de Tenor/Dribbble quase sempre indica decorativo).
   Fora desses casos, **não chame `get_page`** — descreva o que a screenshot já
   mostrou (GIF: "pessoa dormindo em sala de aula"; balão de fala: transcreva o texto
   direto da imagem; mapa/grade: descreva estrutura e transcreva o texto legível) e
   siga para o próximo slide.
   - **`get_page` não aceita um parâmetro `fields` para filtrar a resposta** (diferente
     de `get_presentation`) — cada chamada devolve o JSON bruto da API do Slides
     inteiro (60-70KB típico), o custo mais caro de toda a extração. Isso é o motivo
     de tratá-la como último recurso, não como companheira automática de toda
     screenshot com conteúdo visual.
   - **Uma imagem grande cortada em pedaços diferentes por vários slides é um padrão
     real** (ex.: uma grade de 8 fotos de celebridades aparecendo inteira num slide e,
     em slides posteriores, cortada — `cropProperties` — para mostrar um pedaço
     diferente como elemento decorativo) — mas isso só importa se você já precisou
     abrir `get_page` por outro motivo nesses slides; não é sozinho motivo suficiente
     para chamar `get_page`, já que a screenshot de cada slide já mostra o pedaço
     visível ali.

6. **Transcreva imagens que contêm texto pedagógico, não pule essa etapa.** Muitas aulas
   usam recortes de página de livro didático como imagem — o texto real do exercício
   (o diálogo, a frase-base, o enunciado) frequentemente só existe como pixel dentro
   dessa imagem, não como texto do Slides. **Transcreva direto da screenshot do passo
   4 sempre que o texto estiver legível nela** — não é preciso baixar a imagem em
   separado nem chamar `get_page` para isso; a screenshot já é a fonte primária de
   transcrição. Só recorra ao fluxo do passo 5 (baixar a imagem individual em
   resolução total via `contentUrl`) quando o texto estiver realmente pequeno demais
   na screenshot. Isso é viável e vale o esforço — sem essa etapa, exercícios inteiros
   (frases-base de contração, diálogos com lacuna, tabelas de conjugação) ficam
   invisíveis para a skill de geração de slides, mesmo quando o conteúdo é
   perfeitamente legível na imagem.
   - Pule a transcrição só se a imagem for claramente decorativa (foto de rosto, ícone,
     textura de fundo) — não gaste esforço nessas. Mas "decorativa" tem que ser
     confirmado pela própria imagem/contexto, não assumido porque o texto do slide já
     parecia completo — essa foi exatamente a suposição que causou a falha que a
     screenshot obrigatória (passo 4) existe para prevenir.
   - Ao transcrever, preserve a estrutura visual (tabela, lista numerada, colunas) em
     Markdown equivalente, não só o texto corrido.
   - **GIFs contam como conteúdo a documentar, mesmo quando são puramente
     humorísticos/decorativos** — não precisam de transcrição de texto (não têm texto
     pedagógico), mas registre que existem e descreva brevemente o que mostram (ex.:
     "GIF de humor: pessoa dormindo em sala de aula, usado no slide de chamada"). A
     skill de geração de slides decide depois se um template comporta esse tipo de
     elemento; se a extração simplesmente omitir o GIF, essa decisão nunca chega a ser
     tomada.
   - **Balões de fala (`WEDGE_ROUND_RECTANGLE_CALLOUT`) são conteúdo de exemplo
     modelado, não decoração** — o texto dentro de um balão (ex.: "Brazil!" / "It's
     Brazilian!" em dois balões separados simulando um diálogo) é frequentemente o
     exemplo-modelo central de um slide de prática oral. Transcreva o texto de cada
     balão e registre que a apresentação original os mostrava como bolhas de conversa
     coloridas com rabinho, não como texto corrido — essa é uma pista de didática
     (modelagem de diálogo) que se perde se só o texto for extraído.

7. **Analisar a didática**, não só o conteúdo. Ao ler os slides e notas, identifique:
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

8. **Produzir o documento de saída** em Markdown com esta estrutura:

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
   - Texto de balão de fala: ... (marcar como tal, ex.: "Balão 1 (verde):
     'Brazil!' / Balão 2 (azul): 'It's Brazilian!'" — registre também as cores/estilo
     se relevante para recriar o efeito de diálogo)
   - Notas do apresentador: ...
   - Elementos visuais: fotos/GIFs/ícones e o que mostram (mesmo quando puramente
     decorativos, registre a existência — "GIF de humor: X" ou "foto de Y" — não
     omita silenciosamente; só pule ícones puramente ornamentais tipo bullet/estrela
     de fundo)

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

9. Salvar o documento como arquivo Markdown (ex.: `<slug-da-aula>.md`) no diretório
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
- **O `contentUrl` de uma imagem retornado por `get_page` só baixa certo com o
  parâmetro `?key=...` da URL original intacto.** Baixar sem esse parâmetro (ex.:
  copiar só a parte antes do `?`) retorna erro 400 do Google — e se você não checar o
  arquivo baixado antes de tentar ler, isso falha silenciosamente ou produz uma
  transcrição vazia/errada. Sempre baixe a URL completa como veio no JSON, e confira
  o tamanho do arquivo baixado antes de tentar ler.
- **A URL de export/screenshot do passo 4 não precisa do parâmetro `?key=...`** — é
  uma URL pública do próprio Google Slides
  (`https://docs.google.com/presentation/d/<presentationId>/export/png?id=<presentationId>&pageid=<pageObjectId>`),
  diferente do `contentUrl` de uma imagem individual (que vem do bucket interno do
  Slides e exige a chave). Confirmado funcionando: devolve um PNG do slide
  renderizado (960×720 típico) sem autenticação extra além do acesso já concedido à
  apresentação.
- **Esta etapa de screenshot obrigatória existe por causa de uma falha real**: uma
  extração anterior usou "o resumo de texto parece completo" como critério para pular
  `get_page`, e isso deixou de fora, em uma única aula, um mapa de listening com 9
  blanks, uma grade de 8 celebridades com foto+bandeira+nome+profissão (que também
  alimentava 4 outros slides da mesma aula), 3 GIFs decorativos, 2 pares de balões de
  fala simulando diálogo, e notas do apresentador com instrução de atividade. Nenhum
  desses apareceu no `summarize_presentation`. Não repetir esse critério é o motivo
  pelo qual o passo 4 agora é incondicional.
