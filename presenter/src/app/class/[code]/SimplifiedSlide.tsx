import {
  SectionTransitionData,
  Exercise1Data,
  PhotoCaptionData,
  PptxImageData,
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
};
