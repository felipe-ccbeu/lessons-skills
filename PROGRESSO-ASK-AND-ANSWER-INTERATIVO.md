# Ask and Answer interativo — progresso

**Objetivo:** tornar o slide "Ask and answer!" (template `practiceQaBadges`,
ex.: Slide 9 do deck `basic-1/unit-1/lesson-a/part-1`) interativo — o aluno
responde **Yes/No** no celular e a tela do professor mostra a **contagem
agregada** por pergunta, no mesmo estilo do template `poll` que já existe.

**Decisões tomadas (2026-07-27):**
- Cada pergunta vira uma votação **Yes/No** independente (2 opções). Os rótulos
  das opções são as respostas prontas da linha (`row.yes` = "Yes, I am." /
  `row.no` = "No, I'm not.").
- A tela mostra **contagem agregada** (quantos Yes, quantos No). **Não** lista
  nome de aluno.
- **Não há resposta certa** — as perguntas são sobre o próprio aluno
  ("Are you a student?"). Sem gabarito, sem marcar acerto/erro.
- Abordagem de banco: **migração limpa** (campo novo), não gambiarra de string.

**App de teste no ar:**
`https://educational-mysimon-complement-vincent.trycloudflare.com/lessons/basic-1/unit-1/lesson-a/part-1`
(URL do túnel Cloudflare — pode mudar entre sessões; se cair, reabrir com a
skill `run-presenter`.)

---

## Plano em etapas

- [x] **Etapa 1 — Banco de dados** (feito)
- [x] **Etapa 2 — Abrir as votações (backend)** (feito, falta testar no celular)
- [ ] **Etapa 3 — Tela do professor (telão) mostrar a contagem ao vivo**
- [ ] **Etapa 4 — Celular do aluno votar Yes/No por pergunta**
- [ ] **Etapa 5 — Estado ao vivo (`computeClassSessionState`) montar as rodadas**

> Observação de ordem: o plano original listava 3=telão, 4=celular, 5=estado.
> Na prática a Etapa 5 (estado ao vivo) precisa vir **junto ou antes** da 3 e 4,
> porque é ela que entrega tallies pro telão e a lista de rodadas pro celular.
> Reavaliar a ordem ao retomar.

---

## O que foi feito hoje

### Etapa 1 — Banco de dados
Adicionado o campo `rowIndex` ao modelo `PollSession` para amarrar uma rodada de
votação a uma pergunta específica dentro de um slide multi-pergunta.

- `presenter/prisma/schema.prisma` — `PollSession.rowIndex Int?`
  (null = poll de slide inteiro; 0,1,2… = rodada por linha).
- Migração **`20260727172000_add_poll_session_row_index`** criada e **aplicada
  no `presenter/prisma/dev.db`** (mesmo banco que o app no ar usa).
  SQL: `ALTER TABLE "PollSession" ADD COLUMN "rowIndex" INTEGER;`
- `npx prisma generate` rodado — client Prisma (`src/generated/prisma`)
  regenerado para conhecer o campo novo.

Nada existente quebra: o template `poll` continua criando rodadas com
`rowIndex = null`.

### Etapa 2 — Abrir as votações (backend)
Ao entrar num slide `practiceQaBadges` em modo Apresentar, o professor passa a
abrir **automaticamente uma votação Yes/No por pergunta** (e limpa ao sair).

- `presenter/src/lib/polls.ts`
  - `createPollSession(...)` aceita novo parâmetro opcional `rowIndex`.
  - Nova função `getOpenPollSessionsByRow(partId, slideId)` — retorna um
    `Map<rowIndex, PollSession>` com todas as rodadas abertas de um slide
    multi-pergunta. (Ainda **não é chamada** por ninguém — será usada na
    Etapa 5.)
  - `getOpenPollSessionForSlide(...)` agora filtra `rowIndex: null` para não
    confundir uma rodada de linha com o poll de slide inteiro.
- `presenter/src/app/api/polls/sessions/route.ts` — a API aceita e repassa
  `rowIndex` (opcional).
- `presenter/src/components/PresentationOverlay.tsx`
  - Novo estado `qaSessions` (`Record<rowIndex, {code, options}>`) e ref-guard
    `startedQaForIndex` (contra o double-effect do StrictMode).
  - Novo `useEffect` + função `startQaVoting()`: ao entrar num
    `practiceQaBadges`, abre uma rodada por `row` em paralelo e re-empurra o
    slide atual para os celulares já conectados.

**Estado de compilação:** `npx tsc --noEmit` passa limpo nos arquivos alterados.
Há **1 erro de tipo pré-existente** em `src/components/PresenterApp.tsx:239`
(union type de `Slide[]` num setState) que **não** foi introduzido por esta
feature e **não** impede o dev server (Turbopack transpila sem type-check
estrito). Não mexer nisso dentro deste escopo.

---

## Como testar o que já está pronto (fazer antes de continuar)

### Pré-requisito: reiniciar o dev server
O client Prisma foi regenerado na Etapa 1. Se o server estava rodando antes
disso, **reinicie-o** para ele enxergar o campo `rowIndex` — senão a Etapa 2 vai
dar erro de "coluna/campo desconhecido". Usar a skill `run-presenter` (ou parar
e rodar `npm run dev` de novo dentro de `presenter/`).

### Teste A — não regrediu nada
1. Abrir o app e navegar pelos slides normalmente.
2. Se houver algum slide `poll` (enquete) no deck, entrar em Apresentar, chegar
   nele e confirmar que a votação ainda abre e conta votos como antes.
   **Esperado:** comportamento idêntico ao de antes desta feature.

### Teste B — Etapa 2 (abrir votações)
1. Em **Apresentar**, navegar até o **Slide 9 ("Ask and answer!")**.
2. **A tela NÃO deve mudar visualmente** — a Etapa 2 só abre as votações no
   banco, sem UI. Isso é o esperado.
3. Abrir o console do navegador (F12 → Console) e confirmar que **não aparece
   erro** ao entrar no slide. Sem erro = as rodadas foram abertas.

**Esperado:** entrar no Slide 9 não quebra nada, e nos bastidores 4 votações
Yes/No ficam abertas (uma por pergunta). O aluno **ainda não** consegue votar
(Etapa 4) e a tela **ainda não** mostra contagem (Etapa 3).

### Verificação opcional (ver as rodadas no banco)
Para confirmar de forma concreta que as 4 rodadas abriram com `rowIndex` 0..3,
consultar o `dev.db` depois de passar pelo Slide 9. Pedir ao Claude para rodar
essa checagem, ou usar um script contra `@/generated/prisma/client`
(a base é SQLite better-sqlite3 em `presenter/prisma/dev.db`).

---

## Ao retomar — próximos passos

1. **Reavaliar a ordem 3/4/5.** A Etapa 5 (estado ao vivo em
   `computeClassSessionState`, `presenter/src/lib/classSessions.ts`) provavelmente
   deve vir primeiro, pois entrega os dados que o telão (Etapa 3) e o celular
   (Etapa 4) consomem.
2. **Etapa 5 — estado ao vivo:** estender o bloco `if (slide.template === 'poll')`
   em `computeClassSessionState` para, no caso `practiceQaBadges`, montar um
   array de rodadas + tallies por pergunta (usar `getOpenPollSessionsByRow` +
   `getTallies`). O SSE + fallback já propaga sozinho depois disso.
3. **Etapa 3 — telão:** no renderer `presenter/src/components/slides/PracticeQaBadgesSlide.tsx`,
   sob cada pergunta, mostrar barras Yes/No com contagem ao vivo (reusar o visual
   de `PollOptionBar` em `PollSlide.tsx`). Ligar os `qaSessions`/tallies no
   `PresentationOverlay` (passar como prop, como já é feito com `liveResults` do poll).
4. **Etapa 4 — celular:** em `presenter/src/app/class/[code]/ClassSessionView.tsx`,
   tratar o template `practiceQaBadges` renderizando botões Yes/No por pergunta
   e enviando o voto (reusar a lógica do `VoteForm` em
   `presenter/src/app/poll/[code]/VoteForm.tsx`, adaptada para N perguntas na
   mesma tela). O voto usa o mesmo `voterKey`/deviceKey já existente.

## Arquivos-chave (mapa rápido)
- Schema/migração: `presenter/prisma/schema.prisma`, `presenter/prisma/migrations/`
- Votação (backend): `presenter/src/lib/polls.ts`,
  `presenter/src/app/api/polls/sessions/route.ts`
- Estado ao vivo da aula: `presenter/src/lib/classSessions.ts`
- Telão (professor): `presenter/src/components/PresentationOverlay.tsx`,
  `presenter/src/components/slides/PollSlide.tsx` (referência de UI de barras),
  `presenter/src/components/slides/PracticeQaBadgesSlide.tsx` (alvo)
- Celular (aluno): `presenter/src/app/class/[code]/ClassSessionView.tsx`,
  `presenter/src/app/poll/[code]/VoteForm.tsx` (referência)

## Notas soltas
- **Segurança:** a chave da OpenAI está em texto puro em `presenter/.env`
  (`OPENAI_API_KEY=...`). Fora do escopo desta feature, mas vale rotacionar a
  chave e garantir que `.env` não vá para o versionamento.
