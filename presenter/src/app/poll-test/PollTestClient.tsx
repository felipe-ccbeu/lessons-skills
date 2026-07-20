'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { usePollTallies } from '@/lib/usePollTallies';

type Option = { id: string; label: string };
type Props = { code: string; joinUrl: string; options: Option[] };

export function PollTestClient({ code, joinUrl, options }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { tallies, total } = usePollTallies(code);

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { width: 260, margin: 1 }).then(setQrDataUrl);
  }, [joinUrl]);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>Teste de enquete ao vivo</h1>
      <p style={{ color: '#6b7280', fontSize: 13 }}>
        Código: <strong>{code}</strong> — {joinUrl}
      </p>

      {qrDataUrl && (
        <img src={qrDataUrl} alt="QR code para votar" width={260} height={260} style={{ marginTop: 16 }} />
      )}

      <div style={{ marginTop: 32 }}>
        {options.map((opt) => {
          const count = tallies[opt.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={opt.id} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 15, marginBottom: 6 }}>{opt.label}</div>
              <div style={{ background: '#eee', borderRadius: 8, overflow: 'hidden', height: 28 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0448df, #fd3682)',
                    transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {count} votos ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
