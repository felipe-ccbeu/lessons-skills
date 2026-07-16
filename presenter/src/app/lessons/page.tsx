import Link from 'next/link';
import { getLevels } from '@/lib/lessons';

export default async function LevelsPage() {
  const levels = await getLevels();

  return (
    <div className="min-h-full bg-[#1c1f26] text-[#dfe2e8] px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#fd3682]" />
          <h1 className="text-lg font-bold">CCBEU Slides — Aulas</h1>
        </div>

        {levels.length === 0 ? (
          <p className="text-sm text-[#9aa1ac]">Nenhum nível cadastrado ainda.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {levels.map((level) => (
              <li key={level.id}>
                <Link
                  href={`/lessons/${level.slug}`}
                  className="group block h-full rounded-xl border border-[#3a3f4b] bg-[#20232c] px-5 py-5 hover:bg-[#2a2e38] hover:border-[#4a5164] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-[16px]">{level.title}</span>
                    <span className="flex-none w-9 h-9 rounded-lg bg-[#0448df]/15 text-[#6d8dff] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5V4.5Z" />
                        <path d="M4 19.5V4.5" />
                        <path d="M8 7h8M8 11h6" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] text-[#9aa1ac]">
                    {level._count.units} {level._count.units === 1 ? 'unidade' : 'unidades'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
