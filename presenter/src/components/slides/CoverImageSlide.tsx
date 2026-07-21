import { CoverImageData } from '@/lib/types';

type Props = {
  data: CoverImageData;
};

export function CoverImageSlide({}: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width: 1280,
        height: 720,
        background: 'var(--ccbeu-blue)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 16, height: 16, borderRadius: 999, background: 'var(--ccbeu-pink)' }} />
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '64pt', color: '#fff', letterSpacing: '0.02em' }}>
          CCBEU
        </span>
      </div>
    </div>
  );
}
