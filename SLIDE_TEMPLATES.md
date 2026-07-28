# Sistema de templates de slide (presenter)

Referência de arquitetura do sistema de **templates de slide** do app
`presenter/` — como um slide funciona por dentro, como adicionar um layout novo
e quais refactors deixaram isso mais flexível. Todo o código citado está em
`presenter/src/`.

> Existe um **outro** sistema de "template" no repositório — os 19 arquivos HTML
> com `{{TOKEN}}` da skill `arrange-lessons` (`.scripts/html-to-pptx/*.html`),
> que geram o deck inicial em .pptx. Este documento **não** é sobre aquele; é
> sobre os templates React que o teacher edita e apresenta na tela.

---

## TL;DR — adicionar um template novo

1. **`presenter/src/lib/types.ts`** — crie `FooData` e adicione uma linha ao
   `TemplateDataMap`: `foo: FooData;`.
2. **`presenter/src/components/slides/FooSlide.tsx`** — o renderer (ver
   [o kit](#o-kit-de-primitivos-slidekit) para começar).
3. **`presenter/src/components/slides/index.ts`** — registre em `RENDERERS`:
   `foo: FooSlide,`.
4. **`presenter/src/lib/slideMeta.ts`** — adicione a ficha `foo: { … }` ao
   `TEMPLATE_META` (label, descrição, `createData`, e opcionalmente `dragKeys` /
   `removableLists`).

Os passos 1, 3 e 4 são **obrigados pelo TypeScript** (o build falha se faltar
qualquer um). Nada mais precisa ser tocado: menu, thumbnails, apresentação,
export .pptx e o contexto da IA são todos derivados dessas fontes.

---

## Modelo mental

Um slide é só **dados + o nome de um template**. Nada de layout é salvo no
banco — apenas isto (persistido como JSON em `Part.slides`):

```ts
{ id, template: 'exercise1', data: { … }, /* + overrides opcionais */ }
```

O `template` (uma string) escolhe um **componente renderer** no mapa `RENDERERS`.
O renderer é uma **função pura do `data`**: recebe `data` e desenha o slide numa
tela fixa de **1280×720** com tudo em `position: absolute`.

Três ideias sustentam o resto:

1. **O renderer É o editor.** Não há formulário de edição separado. O mesmo
   componente desenha o slide e, quando recebe `editMode`, troca os textos por
   `<Editable>`. Editar chama `onEdit(patch)`, e o editor faz merge do patch no
   `data`. Thumbnail, apresentação e export usam o mesmo componente com
   `editMode={false}`.
2. **Funcionalidades transversais são genéricas, plugadas por "chave".**
   `answerFields`, `styleOverrides`, `layoutOverrides` (arrastar),
   `blockAnimations` e `pastedBlocks` não sabem nada de um template específico —
   o renderer "opta por elas" espalhando `answerProps('title')` e
   `dragProps('rows')` nos elementos. A chave é um caminho no `data`
   (`"rows.0.hl"`) ou um `dragKey`.
3. **Tela de pixels fixos.** Cada elemento tem `left`/`top` cravados. É o que
   mantém tudo consistente na marca e exporta limpo pro .pptx (o export tira um
   PNG do próprio renderer). É também o que torna cada layout novo trabalhoso —
   por isso o [kit de primitivos](#o-kit-de-primitivos-slidekit).

---

## As peças e onde ficam

| Arquivo | Papel |
|---|---|
| `src/lib/types.ts` | `TemplateDataMap` (fonte da verdade dos dados) → deriva `Slide` e `SlideTemplate` |
| `src/lib/slideMeta.ts` | `TEMPLATE_META`: a ficha de metadata por template (menu, defaults, dragKeys, listas removíveis) |
| `src/components/slides/*Slide.tsx` | Os renderers = display + editor inline |
| `src/components/slides/index.ts` | `RENDERERS`: mapa `template → componente` |
| `src/components/slides/slideKit.tsx` | Primitivos compartilhados (`SlideRoot`, `SlideBreadcrumb`, `SlideFooter`, `slideFieldProps`, `SlideRenderProps`) |
| `src/lib/slide-templates.ts` | `ADDABLE_TEMPLATES`, `createSlideData`, `createSlide` — **derivados** de `TEMPLATE_META` |
| `src/lib/dragKeys.ts` | `DRAG_KEYS_BY_TEMPLATE` — **derivado** de `TEMPLATE_META` |
| `src/lib/removableLists.ts` | `REMOVABLE_LISTS_BY_TEMPLATE` + `resolveRemovableRow` — **derivado** de `TEMPLATE_META` |
| `src/app/class/[code]/SimplifiedSlide.tsx` | Versão leve pro celular do aluno (opcional; cai num card genérico se ausente) |

### Consumidores 100% genéricos (não mudam por template)

O palco do editor, os thumbnails, a apresentação (`PresentationOverlay`), o
export pra .pptx (`deckExport`) e o **route da IA** — todos operam via
`RENDERERS[template]` ou via a metadata derivada. A IA monta o catálogo dela a
partir de `ADDABLE_TEMPLATES` + `DRAG_KEYS_BY_TEMPLATE`, então um template novo
aparece pra ela sozinho.

---

## As três melhorias (refactors de flexibilidade)

Regra de ouro dos três: são **reorganização** ("arrumar o armário"), não mudança
de comportamento. Dados salvos, pixels e o .pptx exportado seguem idênticos; o
TypeScript confere a equivalência; e dá pra migrar aos poucos.

### A — `TemplateDataMap` (mata o boilerplate da união)

Antes, a união `Slide` tinha ~30 linhas, cada uma recopiando os 6 campos de
override. Agora existe um mapa `nome → dados` (`TemplateDataMap`) e a união é
**derivada** dele:

```ts
export type SlideOf<K extends SlideTemplate> =
  { id: string; template: K; data: TemplateDataMap[K] } & SlideOverrides;
export type Slide = { [K in SlideTemplate]: SlideOf<K> }[SlideTemplate];
export type SlideTemplate = keyof TemplateDataMap;
```

Adicionar template = 1 linha no mapa. Adicionar um campo transversal novo = 1
linha em `SlideOverrides` (antes: editar as 30 linhas). A união derivada é
estruturalmente idêntica à antiga — continua discriminada por `.template`.

### B — `TEMPLATE_META` (uma ficha por template)

Quatro estruturas espalhadas em três arquivos descreviam um template
(`ADDABLE_TEMPLATES` + `createSlideData`, `DRAG_KEYS_BY_TEMPLATE`,
`REMOVABLE_LISTS_BY_TEMPLATE`). Agora são **uma ficha por template** em
`slideMeta.ts`:

```ts
export const TEMPLATE_META: { [K in SlideTemplate]: TemplateMeta<K> } = {
  exercise1: {
    addable: true,
    label: 'Exercício',
    description: 'Lista de frases',
    dragKeys: ['title', 'instruction', 'rows'],
    removableLists: [{ rowDragKeyPrefix: 'rows', listPath: 'rows' }],
    createData: () => ({ /* dados padrão */ }),
  },
  // …
};
```

Os módulos antigos passaram a **derivar** seus exports desta ficha, mantendo os
mesmos nomes — nenhum consumidor mudou. Por ser `Record<SlideTemplate, …>`, o TS
obriga cada template a ter entrada, e as quatro facetas não podem mais sair de
sincronia em silêncio (o bug clássico: registrar o renderer mas esquecer o
`dragKeys`, e arrastar não funcionar sem aviso).

> **Fronteira server/client:** `slideMeta.ts` é deliberadamente **livre de
> componentes React**. O route da IA (server) importa `ADDABLE_TEMPLATES` /
> `DRAG_KEYS`, então a metadata não pode arrastar a árvore de componentes client
> pro bundle do servidor. Por isso o mapa de componentes (`RENDERERS`) fica
> separado — e também é obrigado pelo TS.

### C — kit de primitivos (`slideKit.tsx`)

O "papel timbrado" que um renderer compõe em vez de recodificar na mão o wrapper
de palco, os closures de `dragProps`/`answerProps`, o breadcrumb e o rodapé. Ver
a seção abaixo.

Migração é **incremental e segura**: `SectionTransition` e `Comparative` já usam
o kit como referência; os outros renderers seguem inalterados e migram aos
poucos, cada um verificado contra o render anterior (a cor do rodapé, por
exemplo, muda em slides de fundo escuro — por isso `SlideFooter` recebe `color`,
e migração cega em massa é evitada).

---

## O kit de primitivos (slideKit)

Definidos em `src/components/slides/slideKit.tsx`:

- **`SlideRenderProps<K>`** — o tipo de props compartilhado (data/onEdit tipados
  por template + todos os props de edição). Substitui a `Props` de ~14 linhas
  que cada renderer declarava à mão.
- **`slideFieldProps(template, props)`** — devolve `{ dragProps, answerProps }`,
  os dois spreaders por-campo. `dragProps` sempre inclui `template` (inócuo para
  templates sem lista removível; necessário para os que têm).
- **`SlideRoot`** — o palco 1280×720 (`background` opcional, default `#fff`).
- **`SlideBreadcrumb`** — o ponto rosa + breadcrumb (params: `dotSize`,
  `letterSpacing`, `color`, `top` — as variações reais entre templates).
- **`SlideFooter`** — o rodapé "CCBEU English Center" (`color` opcional, default
  `var(--ink-footer)`; slides de fundo escuro passam uma cor clara).

Esqueleto de um renderer novo:

```tsx
export function FooSlide(props: SlideRenderProps<'foo'>) {
  const { data, onEdit, editMode } = props;
  const { dragProps, answerProps } = slideFieldProps('foo', props);
  return (
    <SlideRoot>
      <SlideStagger disabled={editMode}>
        <SlideBreadcrumb
          value={data.breadcrumb}
          onChange={(v) => onEdit({ breadcrumb: v })}
          editMode={editMode}
          answer={answerProps('breadcrumb')}
        />
        {/* …conteúdo específico do Foo, usando dragProps('x') / answerProps('x')… */}
      </SlideStagger>
      <SlideFooter />
    </SlideRoot>
  );
}
```

---

## Adicionar um template novo — checklist detalhado

**Obrigatório (o TS te obriga, exceto o arquivo do componente):**

1. `types.ts` — `FooData` + linha no `TemplateDataMap`.
2. `components/slides/FooSlide.tsx` — o renderer.
3. `components/slides/index.ts` — `foo: FooSlide` em `RENDERERS`
   (`Record<SlideTemplate, …>` → erro de compilação se faltar).
4. `slideMeta.ts` — ficha `foo` em `TEMPLATE_META`
   (`Record<SlideTemplate, …>` → erro se faltar). Inclui `createData`.

**Opcional (o TS NÃO avisa se esquecer):**

- `addable: false` na ficha — se o template só vem de importação/código (como
  `pptxImage` e `customHtml`), para não aparecer no menu "adicionar".
- `dragKeys` na ficha — se blocos devem ser arrastáveis / a IA poder movê-los.
- `removableLists` na ficha — se tiver listas cujas linhas podem ser removidas
  por seleção.
- `SimplifiedSlide.tsx` + `ClassSessionView.tsx` — visão do celular do aluno
  (sem ela, cai num card genérico; não quebra).

---

## Escape hatches (flexibilidade sem template novo)

Se a necessidade é um layout **pontual** (não um template reutilizável), já
existem saídas que não exigem código:

- **`customHtml`** — um slide de HTML livre.
- **`pastedBlocks`** — blocos flutuantes clonados de qualquer template e colados
  em qualquer slide.
- **`styleOverrides` / `layoutOverrides`** — mudar cor/tamanho/negrito de um
  campo e reposicionar blocos, por slide.

Antes de criar um template novo, vale decidir: você quer um **template
reutilizável** ou **liberdade num slide específico**? São ferramentas diferentes.
