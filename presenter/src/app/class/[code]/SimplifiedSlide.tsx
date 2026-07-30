import { Icon } from '@/components/ui/Icon';
import {
  SectionTransitionData,
  Exercise1Data,
  PhotoCaptionData,
  PptxImageData,
  CustomHtmlData,
  GrammarBoxLookData,
  PhotoExerciseWhoIsThisData,
  GuessFourImagesData,
  ObjectivesData,
  GettingStartedData,
  ComparativeData,
  CoverImageData,
  ChangePlacesData,
  CompleteTheChartData,
  Fluency1Data,
  Fluency2Data,
  Fluency3Data,
  WarmupOralTransformData,
  ListenAndRepeatData,
  PhotoGridBlankData,
  GrammarBox2YesNoData,
  ModelExampleListData,
  LessonCompleteData,
  MatchingWithChartData,
  MatchLettersData,
  BlankData,
} from '@/lib/types';

// Deliberately plain, lightweight views for the student's phone — no Framer
// Motion, no desktop two-column layouts, just the content that matters per
// template. 'poll', 'multipleChoice', 'practiceQaBadges' and 'matchVocabImage'
// aren't here: all four are handled specially by ClassSessionView, which
// swaps in a live VoteForm instead.
//
// Answer reveal: every view that shows an answer takes a `revealed` prop
// mirrored from the teacher's overlay (via the class session). Until the
// teacher reveals — i.e. "passes to the right" — answers render as a blank
// so the student sees the exercise but not the solution, exactly like the
// projected slide. `revealed` defaults to true so any caller that doesn't
// pass it (thumbnails, etc.) still shows the full content.

// An inline answer span: the highlighted solution once revealed, a neutral
// blank placeholder before that. Keeps the surrounding sentence layout stable
// so nothing jumps when the teacher reveals.
function AnswerText({ text, revealed }: { text: string; revealed: boolean }) {
  if (revealed) return <strong style={styles.answer}>{text}</strong>;
  return <span style={styles.answerBlank} aria-label="resposta oculta" />;
}

// Read-only counterpart to the editor's ImageSlot (components/ui/ImageSlot.tsx):
// same rounded frame, cover fit, and "sem imagem" placeholder, so a slide with
// no image yet reads the same way here as it does mid-edit on the desktop.
function SimplifiedImage({ url, alt = '', style }: { url: string; alt?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ ...styles.imageFrame, ...style }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} style={styles.imageFrameImg} />
      ) : (
        <div style={styles.imagePlaceholderInner}>
          <Icon name="photo_camera" size={22} />
          sem imagem
        </div>
      )}
    </div>
  );
}

export function SectionTransitionSimplified({ data }: { data: SectionTransitionData }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.tag}>{data.tag}</div>
      <h1 style={styles.bigTitle}>{data.title}</h1>
      <p style={styles.subtitle}>{data.subtitle}</p>
    </div>
  );
}

export function Exercise1Simplified({ data, revealed = true }: { data: Exercise1Data; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <p style={styles.instruction}>
        {data.instructionPre} <strong>{data.instructionHl}</strong> {data.instructionPost}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            <span>{row.orig}</span>
            <span style={{ color: 'var(--ink-footer)' }}> → </span>
            <AnswerText text={row.hl} revealed={revealed} /> {row.post}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhotoCaptionSimplified({ data, revealed = true }: { data: PhotoCaptionData; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <SimplifiedImage url={data.imageUrl} style={{ margin: '4px 0 14px' }} />
      <p style={styles.name}>{data.name}</p>
      <p style={styles.role}>{data.role}</p>
      <p style={styles.instruction}>
        {data.sentencePre} <AnswerText text={data.answer} revealed={revealed} /> {data.sentencePost}
      </p>
    </div>
  );
}

export function PptxImageSimplified({ data }: { data: PptxImageData }) {
  return (
    <div style={{ ...styles.wrap, padding: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.imageUrl} alt={`Slide ${data.slideNumber}`} style={{ width: '100%', display: 'block' }} />
    </div>
  );
}

// Raw imported HTML: render it in an isolated iframe just like the desktop
// slide, but let it fill the phone width instead of a fixed 1280px stage.
// `sandbox=""` keeps the imported page's styles/scripts from leaking out.
export function CustomHtmlSimplified({ data }: { data: CustomHtmlData }) {
  return (
    <div style={{ ...styles.wrap, padding: 0 }}>
      <iframe
        srcDoc={data.html}
        title={data.sourceFile}
        sandbox=""
        style={{
          width: '100%',
          // 16:9 stage: keeps imported slides' internal layout proportional.
          aspectRatio: '16 / 9',
          border: 'none',
          display: 'block',
          background: '#fff',
        }}
      />
    </div>
  );
}

export function GrammarBoxLookSimplified({ data, revealed = true }: { data: GrammarBoxLookData; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.topicName}</h1>
      <p style={styles.instruction}>
        {data.ex1Pre} <AnswerText text={data.ex1Hl} revealed={revealed} /> {data.ex1Post}
      </p>
      <p style={styles.instruction}>
        {data.ex2Pre} <AnswerText text={data.ex2Hl} revealed={revealed} /> {data.ex2Post}
      </p>
      {data.tableHeader && <p style={styles.sectionLabel}>{data.tableHeader}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            <strong>{row.subject}</strong> <AnswerText text={row.hl} revealed={revealed} /> {row.text}
          </div>
        ))}
      </div>
      {data.tips.length > 0 && (
        <ul style={styles.tips}>
          {data.tips.map((tip, i) => (
            <li key={i}>{tip.full}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PhotoExerciseWhoIsThisSimplified({
  data,
  revealed = true,
}: {
  data: PhotoExerciseWhoIsThisData;
  revealed?: boolean;
}) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <SimplifiedImage url={data.imageUrl} style={{ margin: '4px 0 14px' }} />
      {data.personName && <p style={styles.name}>{data.personName}</p>}
      {data.personRole && <p style={styles.role}>{data.personRole}</p>}
      <p style={styles.instruction}>
        {data.sentencePre} <AnswerText text={data.sentenceGap} revealed={revealed} />
      </p>
    </div>
  );
}

export function GuessFourImagesSimplified({ data, revealed = true }: { data: GuessFourImagesData; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.instruction && <p style={styles.instruction}>{data.instruction}</p>}
      {(data.examplePre || data.exampleHl) && (
        <p style={styles.instruction}>
          {data.examplePre} <AnswerText text={data.exampleHl} revealed={revealed} />
        </p>
      )}
      <div style={styles.imageGrid}>
        {data.imageUrls.map((url, i) => (
          <SimplifiedImage key={i} url={url} />
        ))}
      </div>
    </div>
  );
}

export function ObjectivesSimplified({ data }: { data: ObjectivesData }) {
  const items = [
    { verb: data.obj1Verb, node: <>{data.obj1Pre} <strong>{data.obj1Hl}</strong> {data.obj1Post}</> },
    { verb: data.obj2Verb, node: <>{data.obj2Text}</> },
    { verb: data.obj3Verb, node: <>{data.obj3Text}</> },
  ];
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Objectives</h1>
      <ul style={{ ...styles.tips, listStyle: 'none', padding: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: 10 }}>
            <strong style={{ color: 'var(--ccbeu-blue)' }}>{item.verb}</strong> {item.node}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GettingStartedSimplified({ data }: { data: GettingStartedData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.bigTitle}>{data.title}</h1>
      <p style={styles.subtitle}>{data.subtitle}</p>
      {data.imageUrl && <SimplifiedImage url={data.imageUrl} style={{ marginTop: 14 }} />}
    </div>
  );
}

export function ComparativeSimplified({ data }: { data: ComparativeData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <div style={styles.row}>
          <strong style={{ color: 'var(--ccbeu-blue)' }}>{data.leftHl}</strong>
          <p style={{ margin: '4px 0 0' }}>{data.leftText}</p>
        </div>
        <div style={styles.row}>
          <strong style={{ color: 'var(--ccbeu-pink)' }}>{data.rightHl}</strong>
          <p style={{ margin: '4px 0 0' }}>{data.rightText}</p>
        </div>
      </div>
    </div>
  );
}

export function CoverImageSimplified({ data: _data }: { data: CoverImageData }) {
  return (
    <div style={styles.wrap}>
      <p style={{ fontSize: 16, color: 'var(--ink-muted)', margin: 0 }}>Acompanhe pelo telão.</p>
    </div>
  );
}

export function ChangePlacesSimplified({ data, revealed = true }: { data: ChangePlacesData; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            <strong>{row.label}</strong>
            <p style={{ margin: '4px 0 0' }}>
              <AnswerText text={row.sentence} revealed={revealed} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompleteTheChartSimplified({ data, revealed = true }: { data: CompleteTheChartData; revealed?: boolean }) {
  const groups = [data.group1, data.group2];
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginTop: 14 }}>
          <p style={styles.sectionLabel}>{group.label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.rows.map((row, i) => (
              <div key={i} style={styles.row}>
                {row.sentence} <AnswerText text={row.answer} revealed={revealed} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Fluency1Simplified({ data }: { data: Fluency1Data }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.instruction && <p style={styles.instruction}>{data.instruction}</p>}
      <ol style={{ margin: '12px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.questions.map((q, i) => (
          <li key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>
            {typeof q === 'string' ? q : q.pre}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Fluency2Simplified({ data }: { data: Fluency2Data }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <p style={styles.instruction}>
        {data.instructionPre} <strong>{data.instructionHl}</strong>
      </p>
      {data.imageUrl && <SimplifiedImage url={data.imageUrl} style={{ marginTop: 12 }} />}
    </div>
  );
}

export function Fluency3Simplified({ data }: { data: Fluency3Data }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <p style={styles.instruction}>{data.instruction}</p>
      <div style={styles.imageGrid}>
        {[data.imageUrl1, data.imageUrl2].map((url, i) => (
          <SimplifiedImage key={i} url={url} />
        ))}
      </div>
    </div>
  );
}

export function WarmupOralTransformSimplified({
  data,
  revealed = true,
}: {
  data: WarmupOralTransformData;
  revealed?: boolean;
}) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <p style={styles.instruction}>{data.instruction}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            {row.pre} <AnswerText text={row.answer} revealed={revealed} /> {row.post}
          </div>
        ))}
      </div>
      {data.ctaTitle && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontWeight: 700, margin: 0, color: 'var(--ccbeu-pink)' }}>{data.ctaTitle}</p>
          {data.ctaSubtitle && <p style={{ color: 'var(--ink-muted)', margin: '4px 0 0' }}>{data.ctaSubtitle}</p>}
        </div>
      )}
    </div>
  );
}

export function ListenAndRepeatSimplified({ data }: { data: ListenAndRepeatData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Listen &amp; Repeat</h1>
      <ol style={{ margin: '4px 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <li style={{ fontSize: 15 }}>{data.step1}</li>
        <li style={{ fontSize: 15 }}>{data.step2}</li>
        <li style={{ fontSize: 15 }}>
          {data.step3Pre} <strong>{data.step3Hl}</strong>
        </li>
      </ol>
      {data.tip && <p style={{ ...styles.instruction, color: 'var(--ink-muted)', fontStyle: 'italic' }}>{data.tip}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        <div style={styles.row}>{data.dialogueLine1}</div>
        <div style={styles.row}>{data.dialogueLine2}</div>
      </div>
    </div>
  );
}

export function PhotoGridBlankSimplified({ data, revealed = true }: { data: PhotoGridBlankData; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
        {data.items.map((item, i) => (
          <div key={i}>
            {item.imageUrl && <SimplifiedImage url={item.imageUrl} />}
            <p style={{ ...styles.instruction, margin: '8px 0 0' }}>
              <AnswerText text={item.answer} revealed={revealed} /> {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GrammarBox2YesNoSimplified({ data }: { data: GrammarBox2YesNoData }) {
  return (
    <div style={styles.wrap}>
      {(data.photo1Caption || data.photo2Caption) && (
        <p style={{ ...styles.instruction, color: 'var(--ink-muted)' }}>
          {[data.photo1Caption, data.photo2Caption].filter(Boolean).join(' · ')}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            <strong>{row.subject}</strong> <strong style={{ color: 'var(--ccbeu-blue)' }}>{row.qHl}</strong> {row.qPost}
            <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)' }}>
              {row.aPre} {row.aYes} / {row.aMid} / {row.aNo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModelExampleListSimplified({ data }: { data: ModelExampleListData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.example && (
        <p style={{ ...styles.instruction, fontStyle: 'italic', color: 'var(--ink-muted)' }}>{data.example}</p>
      )}
      <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.items.map((item, i) => (
          <li key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LessonCompleteSimplified({ data }: { data: LessonCompleteData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Lesson complete!</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        {data.columns.map((col, ci) => (
          <div key={ci}>
            <p style={styles.sectionLabel}>{col.header}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {col.terms.map((term, ti) => (
                <div key={ti} style={styles.row}>
                  <strong>{term.t}</strong>
                  {term.d && <span style={{ color: 'var(--ink-muted)' }}> — {term.d}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchingWithChartSimplified({
  data,
  revealed = true,
}: {
  data: MatchingWithChartData;
  revealed?: boolean;
}) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.matchLabel && <p style={styles.sectionLabel}>{data.matchLabel}</p>}
      <ol style={{ margin: '4px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.matchPrompts.map((p, i) => (
          <li key={i} style={{ fontSize: 14 }}>
            {p}
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {data.matchOptions.map((opt, i) => (
          <span key={i} style={styles.pill}>
            {String.fromCharCode(97 + i)}. {opt}
          </span>
        ))}
      </div>
      {data.chartLabel && <p style={{ ...styles.sectionLabel, marginTop: 16 }}>{data.chartLabel}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.chartRows.map((row, i) => (
          <div key={i} style={styles.row}>
            {row.label} <AnswerText text={row.answer} revealed={revealed} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchLettersSimplified({ data, revealed = true }: { data: MatchLettersData; revealed?: boolean }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.instruction && <p style={styles.instruction}>{data.instruction}</p>}
      {data.gridImageUrl && <SimplifiedImage url={data.gridImageUrl} style={{ margin: '4px 0 14px' }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            {row.term} <span style={{ color: 'var(--ink-footer)' }}> → </span>
            <AnswerText text={row.letter} revealed={revealed} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlankSimplified({ data: _data }: { data: BlankData }) {
  return (
    <div style={styles.wrap}>
      <p style={{ fontSize: 16, color: 'var(--ink-muted)', margin: 0 }}>Acompanhe pelo telão.</p>
    </div>
  );
}

const styles = {
  wrap: {
    padding: '20px 18px 22px',
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: 'var(--font-body)',
    color: 'var(--ink)',
  },
  tag: {
    fontFamily: 'var(--font-title)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--ccbeu-pink)',
    marginBottom: 8,
  },
  bigTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: 28,
    fontWeight: 800,
    margin: '0 0 12px',
    color: 'var(--ccbeu-blue)',
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
  },
  title: {
    fontFamily: 'var(--font-title)',
    fontSize: 21,
    fontWeight: 700,
    margin: '0 0 14px',
    color: 'var(--ccbeu-blue)',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  subtitle: { fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 400, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.5 },
  instruction: { fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.55 },
  name: { fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 700, color: 'var(--ccbeu-pink)', margin: 0 },
  role: { fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 400, color: 'var(--ink-muted)', margin: '2px 0 14px' },
  answer: { fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--ccbeu-pink)' },
  // Placeholder shown in place of an answer before the teacher reveals it: a
  // short pink underline, sized to read as "fill-in-the-blank" without hinting
  // at the answer's length.
  answerBlank: {
    display: 'inline-block',
    width: 44,
    height: 2,
    borderRadius: 999,
    background: 'linear-gradient(90deg, var(--ccbeu-pink), #ff8fb8)',
    verticalAlign: 'middle',
  },
  row: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    color: 'var(--ink)',
    borderBottom: '1px solid var(--border-hair)',
    padding: '9px 0',
  },
  sectionLabel: {
    fontFamily: 'var(--font-title)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-muted)',
    margin: '18px 0 10px',
  },
  tips: { fontFamily: 'var(--font-body)', margin: '12px 0 0', paddingLeft: 18, fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.5 },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 14,
  },
  // Read-only mirror of the editor's .img-slot (globals.css): same tinted
  // background, rounded frame and cover fit, so an image reads identically
  // here and mid-edit on the desktop.
  imageFrame: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    borderRadius: 14,
    background: '#eef1f8',
    aspectRatio: '4 / 3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFrameImg: { width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' as const },
  imagePlaceholderInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: '#9aa3b5',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
  },
  pill: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'var(--chrome-bg-subtle)',
    color: 'var(--ink)',
  },
};
