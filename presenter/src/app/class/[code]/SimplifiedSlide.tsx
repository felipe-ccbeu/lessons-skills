import {
  SectionTransitionData,
  Exercise1Data,
  PhotoCaptionData,
  PptxImageData,
  CustomHtmlData,
  GrammarBoxLookData,
  PhotoExerciseWhoIsThisData,
  GuessFourImagesData,
} from '@/lib/types';

// Deliberately plain, lightweight views for the student's phone — no Framer
// Motion, no desktop two-column layouts, just the content that matters per
// template. 'poll', 'multipleChoice' and 'practiceQaBadges' aren't here: all
// three are handled specially by ClassSessionView, which swaps in a live
// VoteForm instead.
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
  if (revealed) return <strong style={{ color: '#fd3682' }}>{text}</strong>;
  return <span style={styles.answerBlank} aria-label="resposta oculta" />;
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
            <span style={{ color: '#9aa1ac' }}> → </span>
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
      {data.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.imageUrl} alt="" style={{ width: '100%', borderRadius: 12, margin: '12px 0' }} />
      )}
      <p style={{ fontWeight: 700, margin: 0 }}>{data.name}</p>
      <p style={{ color: '#6b7280', margin: '2px 0 12px' }}>{data.role}</p>
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
      {data.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.imageUrl} alt="" style={{ width: '100%', borderRadius: 12, margin: '12px 0' }} />
      )}
      {data.personName && <p style={{ fontWeight: 700, margin: 0 }}>{data.personName}</p>}
      {data.personRole && <p style={{ color: '#6b7280', margin: '2px 0 12px' }}>{data.personRole}</p>}
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
        {data.imageUrls.map((url, i) =>
          url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" style={{ width: '100%', borderRadius: 10, display: 'block' }} />
          ) : (
            <div key={i} style={styles.imagePlaceholder} />
          )
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    padding: 24,
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
    color: '#1c2027',
  },
  tag: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#fd3682',
    marginBottom: 8,
  },
  bigTitle: { fontSize: 30, fontWeight: 800, margin: '0 0 12px', color: '#0448df', lineHeight: 1.15 },
  title: { fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0448df' },
  subtitle: { fontSize: 16, color: '#6b7280', margin: 0, lineHeight: 1.4 },
  instruction: { fontSize: 15, color: '#1c2027', lineHeight: 1.5 },
  // Placeholder shown in place of an answer before the teacher reveals it: a
  // short pink underline, sized to read as "fill-in-the-blank" without hinting
  // at the answer's length.
  answerBlank: {
    display: 'inline-block',
    width: 44,
    borderBottom: '2px solid #fd3682',
    verticalAlign: 'middle',
  },
  row: { fontSize: 14, lineHeight: 1.5, borderBottom: '1px solid #e4e6eb', paddingBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    margin: '16px 0 8px',
  },
  tips: { margin: '12px 0 0', paddingLeft: 18, fontSize: 14, color: '#6b7280', lineHeight: 1.5 },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 14,
  },
  imagePlaceholder: { width: '100%', aspectRatio: '1', borderRadius: 10, background: '#eef0f3' },
};
