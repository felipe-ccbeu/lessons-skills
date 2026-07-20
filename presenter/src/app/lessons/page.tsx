import Link from 'next/link';
import { getLevels } from '@/lib/lessons';
import { requireUser } from '@/lib/dal';
import { TopHeader } from '@/components/TopHeader';
import { AddCard } from '@/components/admin/AddCard';
import { RemoveIconButton } from '@/components/admin/RemoveIconButton';
import { createLevelAction, deleteLevelAction } from '@/lib/admin-actions';

export default async function LevelsPage() {
  const user = await requireUser();
  const canEdit = user.role === 'ADMIN' || user.role === 'COORDINATOR';
  const levels = await getLevels();

  return (
    <div className="min-h-full">
      <TopHeader />
      <div className="bg-[#f3f4f7] text-[#1c2027] px-8 py-10 pt-[calc(65px+2.5rem)]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fd3682]" />
            <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#0448df]">Aulas</span>
          </div>
          <h1 className="font-[family-name:var(--font-title)] text-[26px] font-bold text-[#1c2027] mb-8">Níveis</h1>

          {levels.length === 0 ? (
            <p className="text-sm text-[#9aa1ac]">Nenhum nível cadastrado ainda.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {levels.map((level) => (
                <li key={level.id} className="relative">
                  <Link
                    href={`/lessons/${level.slug}`}
                    className="group block h-full rounded-2xl border border-[#e4e6eb] bg-white px-6 py-6 hover:border-[#fd3682] transition-colors duration-200"
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="font-[family-name:var(--font-title)] text-[17px] font-bold text-[#1c2027] mb-6 pr-8">
                        {level.title}
                      </h3>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-[12.5px] text-[#9aa1ac]">
                          {level._count.units} {level._count.units === 1 ? 'unidade' : 'unidades'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[#fd3682] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {canEdit && <RemoveIconButton id={level.id} deleteAction={deleteLevelAction} />}
                </li>
              ))}
              {canEdit && (
                <li>
                  <AddCard action={createLevelAction} label="Adicionar nível" />
                </li>
              )}
            </ul>
          )}

          {canEdit && levels.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AddCard action={createLevelAction} label="Adicionar nível" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
