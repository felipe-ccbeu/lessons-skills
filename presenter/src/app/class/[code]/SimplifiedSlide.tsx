import {
  SectionTransitionData,
  Exercise1Data,
  PhotoCaptionData,
  PptxImageData,
  CustomHtmlData,
  GrammarBoxLookData,
  MultipleChoiceData,
  PracticeQaBadgesData,
  PhotoExerciseWhoIsThisData,
  GuessFourImagesData,
} from '@/lib/types';

// Deliberately plain, lightweight views for the student's phone — no Framer
// Motion, no desktop two-column layouts, just the content that matters per
// template. The 'poll' template isn't here: it's handled specially by
// ClassSessionView, which swaps in the reused VoteForm instead.

export function SectionTransitionSimplified({ data }: { data: SectionTransitionData }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.tag}>{data.tag}</div>
      <h1 style={styles.bigTitle}>{data.title}</h1>
      <p style={styles.subtitle}>{data.subtitle}</p>
    </div>
  );
}

export function Exercise1Simplified({ data }: { data: Exercise1Data }) {
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
            <strong style={{ color: '#fd3682' }}>{row.hl}</strong> {row.post}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhotoCaptionSimplified({ data }: { data: PhotoCaptionData }) {
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
        {data.sentencePre} <strong style={{ color: '#fd3682' }}>{data.answer}</strong> {data.sentencePost}
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

export function GrammarBoxLookSimplified({ data }: { data: GrammarBoxLookData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.topicName}</h1>
      <p style={styles.instruction}>
        {data.ex1Pre} <strong style={{ color: '#fd3682' }}>{data.ex1Hl}</strong> {data.ex1Post}
      </p>
      <p style={styles.instruction}>
        {data.ex2Pre} <strong style={{ color: '#fd3682' }}>{data.ex2Hl}</strong> {data.ex2Post}
      </p>
      {data.tableHeader && <p style={styles.sectionLabel}>{data.tableHeader}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.row}>
            <strong>{row.subject}</strong> <span style={{ color: '#fd3682' }}>{row.hl}</span> {row.text}
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

export function MultipleChoiceSimplified({ data }: { data: MultipleChoiceData }) {
  return (
    <div style={styles.wrap}>
      {data.tag && <div style={styles.tag}>{data.tag}</div>}
      <h1 style={styles.title}>{data.question}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {data.options.map((opt, i) => (
          <div key={opt.id} style={styles.choice}>
            <span style={styles.choiceLetter}>{String.fromCharCode(65 + i)}</span>
            <span>{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PracticeQaBadgesSimplified({ data }: { data: PracticeQaBadgesData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {data.rows.map((row, i) => (
          <div key={i} style={styles.qaCard}>
            <p style={{ fontWeight: 700, margin: '0 0 6px' }}>{row.question}</p>
            <p style={{ margin: 0, fontSize: 14 }}>
              <span style={styles.badgeYes}>Yes</span> {row.yes}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 14 }}>
              <span style={styles.badgeNo}>No</span> {row.no}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhotoExerciseWhoIsThisSimplified({ data }: { data: PhotoExerciseWhoIsThisData }) {
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
        {data.sentencePre} <strong style={{ color: '#fd3682' }}>{data.sentenceGap}</strong>
      </p>
    </div>
  );
}

export function GuessFourImagesSimplified({ data }: { data: GuessFourImagesData }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>{data.title}</h1>
      {data.instruction && <p style={styles.instruction}>{data.instruction}</p>}
      {(data.examplePre || data.exampleHl) && (
        <p style={styles.instruction}>
          {data.examplePre} <strong style={{ color: '#fd3682' }}>{data.exampleHl}</strong>
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
  choice: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 15,
    lineHeight: 1.4,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid #e4e6eb',
  },
  choiceLetter: { fontWeight: 800, color: '#0448df', flexShrink: 0 },
  qaCard: { padding: '12px 14px', borderRadius: 10, border: '1px solid #e4e6eb' },
  badgeYes: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    color: '#0448df',
    background: '#e7edff',
    borderRadius: 999,
    padding: '1px 8px',
    marginRight: 6,
  },
  badgeNo: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    color: '#b3261e',
    background: '#fde8e6',
    borderRadius: 999,
    padding: '1px 8px',
    marginRight: 6,
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 14,
  },
  imagePlaceholder: { width: '100%', aspectRatio: '1', borderRadius: 10, background: '#eef0f3' },
};
