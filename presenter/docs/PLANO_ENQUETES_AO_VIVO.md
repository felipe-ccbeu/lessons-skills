# Plano: Enquetes ao vivo na apresentação (presenter)

Feature: alunos escaneiam um QR code durante a apresentação e respondem enquetes de múltipla escolha em tempo real; o telão mostra os votos chegando ao vivo (estilo Kahoot/Mentimeter).

Decisões já tomadas com o usuário:
- Modelo de participação: **tempo real** (não assíncrono).
- Acesso dos alunos: via **túnel Cloudflare** (`cloudflared tunnel --url`), não IP local da rede Wi-Fi. Validado num protótipo descartável fora do app (`poll-quicktest/`, já removido) — voto de celular via dados móveis atualizou a tela do notebook ao vivo através de uma URL `trycloudflare.com`.
- Tipo de interação inicial: **enquete de múltipla escolha** (2-4 opções). Resposta aberta/texto livre fica para depois.

## Por que túnel em vez de IP local

O plano original assumia professor e alunos na mesma rede Wi-Fi sem isolamento de cliente — mas isso não é garantido (redes de escola/escritório costumam isolar dispositivos entre si). O túnel Cloudflare contorna isso completamente: os alunos acessam por HTTPS público, de qualquer rede (dados móveis inclusive), sem depender da topologia da rede local. Testado e aprovado pelo usuário.

Implicações pro design:
- **`joinUrl` não é mais construído a partir de `os.networkInterfaces()`** — vem da URL pública que o túnel expõe.
- O túnel precisa estar **rodando antes** do professor apresentar, e sua URL precisa chegar até o código que gera o QR. Duas formas de resolver isso (ver seção 6).
- Como é um túnel público na internet (ainda que efêmero, sem conta), **qualquer pessoa com o link pode votar** enquanto o túnel estiver de pé — aceitável para o caso de uso (sala de aula, URL não é adivinhável, sessão dura só a aula), mas vale deixar registrado como trade-off consciente, não descuido.
- Túneis "quick" da Cloudflare (sem conta) não têm garantia de uptime e podem ser encerrados/mudar de URL a qualquer momento — não é adequado pra produção séria, mas está alinhado com o app hoje (uso local pelo professor, sem deploy definido). Se isso amadurecer pra uso recorrente, vale considerar um túnel nomeado (requer conta Cloudflare gratuita) para ter uma URL estável.
- **Descoberta importante (implementação real, não só protótipo)**: Cloudflare Quick Tunnel **não repassa SSE** — confirmado em teste de ponta a ponta dentro do app real (não só no protótipo isolado). Os headers HTTP chegam (`200`, `Content-Type: text/event-stream`), mas o corpo do stream fica bufferizado indefinidamente e nunca é entregue ao cliente, mesmo forçando o túnel a usar HTTP/2 em vez de QUIC como transporte (testado, mesmo resultado nos dois). O `POST` de voto e um `GET` de tallies comuns (não-streaming) atravessam o túnel normalmente e instantaneamente. Por isso a seção 1 abaixo passou a incluir um **fallback automático SSE→polling** como parte do caminho principal (não só como plano B teórico) — ver `src/lib/usePollTallies.ts`.

## Contexto do app existente

- Next.js 16 (App Router), sem servidor custom, `next dev`/`next start` puro.
- Slides: união discriminada `Slide` em `src/lib/types.ts`, `RENDERERS: Record<SlideTemplate, Component>` em `src/components/slides/index.ts`.
- Cada slide renderer recebe `{ data, onEdit, editMode, answerFields, onToggleAnswerField, revealAnswers }`.
- Apresentação: `src/components/PresentationOverlay.tsx` — fullscreen, scaling, navegação por teclado, `AnimatePresence`/`variants`/`transition` por template (`slideTransition`), stagger de elementos internos via `SlideStagger`/`SlideStaggerItem` (Framer Motion / pacote `motion`).
- Persistência: Prisma + SQLite. `Level > Unit > Lesson > Part`, `Part.slides` é um `Json` com o array `Slide[]`. Rota `src/app/api/lessons/[level]/[unit]/[lesson]/[part]/route.ts` (GET/PUT).
- Sem auth, sem infraestrutura de realtime hoje.

## 1. Transporte em tempo real: SSE via Route Handler

Comparado três opções:

- **(a) Servidor WebSocket custom ao lado do Next** — exige ejetar de `next dev`/`next start` pra um `server.js` customizado. Maior fricção, menos portável pra um futuro host serverless. Só valeria a pena para push bidirecional em escala, que uma enquete de sala de aula não precisa.
- **(b) SSE a partir de um Route Handler** — unidirecional (servidor→cliente), um `GET` retornando `ReadableStream` (suportado pelo Next 16 num processo Node persistente). Votos são só um `POST` fire-and-forget. Sem dependência nova, sem mudar o modelo de processo. Funciona perfeitamente **localmente**, mas **não atravessa o Cloudflare Quick Tunnel** (ver descoberta acima) — headers chegam, corpo do stream nunca é entregue.
- **(c) Polling em intervalo curto** — mais simples, com lag perceptível a ~1.5s (aceitável pro caso de uso), mas comprovadamente atravessa o túnel sem problema (é `fetch` request/response comum, não streaming).

**Implementado: SSE (b) como caminho principal + polling (c) como fallback automático de verdade, não só teórico.** `src/lib/usePollTallies.ts` tenta `EventSource` primeiro; se nenhum evento chegar em 2.5s (janela de graça), fecha a conexão SSE e passa a fazer `fetch` a cada 1.5s em `GET /api/polls/[code]/tallies`. Isso cobre os dois cenários sem precisar saber de antemão se vai rodar atrás de túnel ou em rede local:
- Rede local (sem túnel): SSE entrega o primeiro evento quase instantaneamente, fica em modo "tempo real" de verdade.
- Atrás do Cloudflare Quick Tunnel: SSE nunca entrega nada, cai pro polling após 2.5s, e a partir daí atualiza a cada 1.5s — visivelmente "ao vivo" ainda que não instantâneo.

- `GET /api/polls/[code]/stream` — mantém conexão aberta, envia evento JSON a cada voto (+ heartbeat a cada ~15s) + um padding inicial de ~2KB (tentativa de destravar buffer de proxy — não resolveu o caso do Quick Tunnel, mas não tem custo e ajuda em outros proxies intermediários que bufferizam por tamanho de chunk).
- `GET /api/polls/[code]/tallies` — fallback: mesma consulta de tallies, mas como resposta HTTP comum (sem streaming).
- `POST /api/polls/[code]/vote` — grava `PollVote`, notifica o stream (para quem estiver em modo SSE) via `pollEvents`.
- Fan-out em memória: como voto e stream vivem no mesmo processo Node, um `EventEmitter` singleton em módulo (`src/lib/pollEvents.ts`) basta — sem Redis/pub-sub nessa escala.

**Se migrar pra nuvem/múltiplas instâncias depois**: o `EventEmitter` em memória quebra assim que houver mais de um processo. Troca: Postgres `LISTEN/NOTIFY`, Redis pub/sub, ou serviço gerenciado (Pusher/Ably/Supabase Realtime) — por trás da mesma interface `pollEvents.emit`/`.subscribe`. O modelo de dados de votos não muda, só o mecanismo de fan-out.

## 2. Modelo de dados (`prisma/schema.prisma`)

```prisma
model PollSession {
  id        String   @id @default(cuid())
  code      String   @unique            // código curto pro QR/URL
  partId    String                      // a qual Part (deck) pertence
  slideId   String                      // Slide.id do slide de enquete no deck
  status    String   @default("open")   // "open" | "closed"
  options   PollOption[]
  votes     PollVote[]

  part      Part     @relation(fields: [partId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  closedAt  DateTime?
}

model PollOption {
  id            String   @id @default(cuid())
  pollSessionId String
  label         String
  order         Int      @default(0)

  pollSession PollSession @relation(fields: [pollSessionId], references: [id], onDelete: Cascade)
  votes       PollVote[]
}

model PollVote {
  id            String   @id @default(cuid())
  pollSessionId String
  optionId      String
  voterKey      String    // identificador opaco por dispositivo

  pollSession PollSession @relation(fields: [pollSessionId], references: [id], onDelete: Cascade)
  option      PollOption  @relation(fields: [optionId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([pollSessionId, voterKey])   // um voto por dispositivo por rodada
}
```

Decisões:
- **"Rodada" em vez de "reset"**: toda vez que o professor (re-)abre a votação naquele slide, nasce uma `PollSession` nova (código novo, opções copiadas do `pollData` atual do slide, votos zerados) em vez de limpar uma sessão existente. Isso resolve "reabrir votação depois" naturalmente e mantém histórico.
- **Código da sala vs URL de entrada**: `code` curto e único basta pra desambiguar "esta rodada específica" — não precisa de conceito separado de "turma" ou login de professor.
- **Prevenção de voto duplicado sem conta**: `voterKey` (UUID aleatório) gerado no navegador do aluno na primeira carga da página de entrada, persistido em `localStorage`. Garantia real é a constraint `@@unique([pollSessionId, voterKey])` no servidor. Intencionalmente fraco (dá pra burlar limpando storage/aba anônima) — mesmo trade-off do Kahoot/Menti.
- **Por que não guardar votos no JSON de `Part.slides`**: votos são de alta rotatividade, por rodada, irrelevantes pro histórico de edição do deck. Tabelas relacionais deixam a rota de salvar deck intocada e permitem agregação barata (`groupBy` em `optionId`).

## 3. Novo template de slide: `poll`

Em `src/lib/types.ts`:

```ts
export type PollOptionDraft = { id: string; label: string };

export type PollData = {
  breadcrumb: string;
  question: string;
  options: PollOptionDraft[];   // 2-4, definidas na hora de montar o deck
};
```

Adicionado à união `Slide` como `{ id: string; template: 'poll'; data: PollData; answerFields?: AnswerFields }`. `answerFields` fica só por consistência estrutural — não tem "resposta certa" numa enquete, `PollSlide.tsx` nunca lê/consome isso.

`src/components/slides/PollSlide.tsx`, mesmo formato de `Props` dos outros:
- `data`, `onEdit`, `editMode` — mesma semântica: no modo edição, professor edita `question` e cada `label` via `Editable`; adiciona/remove opções (2-4) espelhando o padrão `addRow`/`removeRow` do `Exercise1Slide`.
- `answerFields`/`onToggleAnswerField`/`revealAnswers` — aceitos por compatibilidade de tipo, ignorados no corpo do componente.
- **Props novas, só em apresentação** (`editMode={false}`, passadas pelo `PresentationOverlay`): `liveResults?: { code, joinUrl, tallies, totalVotes, open }` e `onStartVoting?: () => void`. Ausentes no editor/thumbnails — aí o componente mostra só pergunta + opções estáticas.
- **Visual**: pergunta + opções com a tipografia padrão do deck, e (só ao apresentar com sessão ativa) QR code + código curto num canto, barra horizontal animada por opção com Framer Motion (`animate={{ width: pct + '%' }}`), reaproveitando as constantes de spring já usadas em `SlideStagger.tsx`.

Registrar em `RENDERERS` (`src/components/slides/index.ts`) e adicionar entrada `poll` em `slideTransition` (`PresentationOverlay.tsx`).

## 4. Fluxo do aluno

Rotas novas em `src/app/poll/[code]/`:
- `page.tsx` — página de entrada+voto. Mobile-first, coluna única, alvos de toque grandes. Sem auth, sem o chrome do `PresenterApp`.
- **URL/QR**: `<url-do-tunel>/poll/<code>` — só o `code` já identifica a sessão (e por relação, pergunta/opções). Server component busca `PollSession` (com `options`) por `code` via Prisma direto; 404 (`notFound()`) se código não existe ou `status !== 'open'`.
- **Fluxo na página**: pergunta + opções como botões grandes. Toque: lê/gera `voterKey` do `localStorage`, `POST /api/polls/[code]/vote { optionId, voterKey }`, muda pra estado "Votado! Obrigado". Se o POST der 409 (voterKey já usado nessa sessão), mostra "Você já votou nessa rodada".
- **Feedback ao aluno**: fire-and-forget é suficiente — confirmação estática "obrigado, olhe o telão", sem assinar SSE na página do aluno.

## 5. Tela do professor (resultados ao vivo)

Estender `PresentationOverlay.tsx` (não criar variante/fork):
- Estado `pollSession: { code, joinUrl, tallies, totalVotes, open } | null`, criado via `useEffect` disparado quando `slide.template === 'poll'` — `POST /api/polls/sessions { partId, slideId, options }` inicia rodada nova (considerar gatilho explícito "Iniciar votação" em vez de abrir votos assim que o slide aparece).
- Assina `GET /api/polls/[code]/stream` (`EventSource`) enquanto o slide estiver ativo; atualiza `tallies`; desmonta o `EventSource` na troca de slide/unmount.
- Passa `tallies`/`totalVotes`/`joinUrl`/`code` pro `PollSlide` como `liveResults`.
- **Reabrir**: se o professor volta pro mesmo slide de enquete depois, o efeito dispara de novo e cria uma sessão **nova** (código/QR novos) em vez de retomar a antiga.

## 6. QR code e a URL do túnel

- Biblioteca: `qrcode` (npm) — gera QR como SVG/data-URL, zero dependências de runtime, MIT.
- **De onde vem a URL pública** (`joinUrl`), já que não é mais IP local — duas abordagens, em ordem de preferência:
  1. **Env var manual (mais simples, recomendado pra começar)**: o professor sobe `cloudflared tunnel --url http://localhost:3000` à parte (um `npm script` auxiliar, ex. `npm run tunnel`, documentado no README), cola a URL gerada (`https://algo.trycloudflare.com`) numa variável de ambiente `PUBLIC_BASE_URL` (ou numa tela de configuração simples no editor) antes de começar a apresentar. O código de geração de `joinUrl` sempre prioriza `PUBLIC_BASE_URL` se definida.
  2. **Automatizado (fase posterior, opcional)**: o próprio Next, ao subir, dispara `cloudflared` como subprocesso (`child_process.spawn`), captura a URL do stdout (mesmo padrão do `INF ... trycloudflare.com` visto no protótipo) e expõe via uma rota interna (`GET /api/tunnel-url`) ou grava num arquivo/env em runtime. Mais conveniente (nada pra copiar/colar), mas adiciona complexidade de processo (gerenciar o ciclo de vida do subprocesso, o que acontece se cair no meio da aula, etc.) — vale só depois que o fluxo manual provar que a mecânica central funciona de ponta a ponta.
- Isso **substitui** a seção de "detecção de IP local via `os.networkInterfaces()`" do plano anterior — não é mais necessária.

## 7. Ordem de construção (fases)

**Fase 0** — modelo de dados + uma enquete fixa, sem integração com slide, com túnel manual. Prisma models + migration, uma `PollSession` com 2-4 `PollOption`s (via seed/Prisma Studio), `POST /api/polls/[code]/vote` e um `/poll/[code]/page.tsx` bem simples. Subir `cloudflared tunnel --url http://localhost:3000` manualmente pra testar. Provar: dois celulares (via túnel, de redes diferentes) votam, segundo voto do mesmo `voterKey` é rejeitado.

**Fase 1** — push ao vivo pra uma página de resultados descartável. `GET /api/polls/[code]/stream` (SSE) + `pollEvents` em memória, página de resultados mínima que assina e re-renderiza uma lista de contagem sem estilo. Provar: voto do celular (via túnel) atualiza a tela em ~1s sem F5 — essencialmente repetir o protótipo já validado, mas dentro do app Next real com Prisma.

**Fase 2** — QR code + `PUBLIC_BASE_URL` manual. Dependência `qrcode`, leitura da env var, `joinUrl` de verdade, QR renderizado. Provar: escanear QR na tela do notebook a partir de um celular real (em outra rede) cai na página certa sem digitar nada.

**Fase 3** — template `poll` + `PollSlide.tsx`, só no editor (sem sessão ao vivo ainda). Tipo, renderer (edição de pergunta/opções), registro em `RENDERERS`/`slideTransition`. Provar: professor adiciona slide de enquete a um deck real, edita, salva/recarrega pela rota existente.

**Fase 4** — ligar o ciclo de vida da sessão ao vivo no `PresentationOverlay`. Estado/efeito, chamada de início de sessão, assinatura/desmontagem SSE, `liveResults` de verdade no `PollSlide`, QR + barras animadas. Provar: caminho completo — professor sobe o túnel, apresenta, chega no slide de enquete, QR aparece, celular vota através do túnel, barras animam ao vivo, professor avança e o `EventSource` fecha limpo.

**Fase 5** — reabrir/re-rodar + polimento. Confirmar que revisitar o slide gera sessão nova; mensagem de "já votou"; fallback SSE→polling; contador de respostas visível ao professor; considerar automatizar o túnel (item 2 da seção 6) se o fluxo manual se mostrar incômodo na prática.

Fases 0-2 não tocam em `PresenterApp`/`PresentationOverlay`/`types.ts` — risco isolado até a questão de transporte/túnel estar provada dentro do app real (não só no protótipo isolado).

### Arquivos-chave para implementação
- `presenter/prisma/schema.prisma`
- `presenter/src/lib/types.ts`
- `presenter/src/components/PresentationOverlay.tsx`
- `presenter/src/components/slides/index.ts`
- `presenter/src/lib/lessons.ts`
- `presenter/src/components/slides/Exercise1Slide.tsx` (referência de padrão pra lista editável de opções)
- `presenter/src/app/api/lessons/[level]/[unit]/[lesson]/[part]/route.ts` (referência de padrão pras novas rotas `/api/polls/*`)
