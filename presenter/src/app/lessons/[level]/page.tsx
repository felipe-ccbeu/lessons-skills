import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUnits } from '@/lib/lessons';
import { Breadcrumb } from '@/components/Breadcrumb';
import { requireUser } from '@/lib/dal';
import { AddCard } from '@/components/admin/AddCard';
import { RemoveIconButton } from '@/components/admin/RemoveIconButton';
import { createUnitAction, deleteUnitAction } from '@/lib/admin-actions';

type Props = { params: Promise<{ level: string }> };

export default async function UnitsPage({ params }: Props) {
  const user = await requireUser();
  const canEdit = user.role === 'ADMIN' || user.role === 'COORDINATOR';
  const { level: levelSlug } = await params;
  const found = await getUnits(levelSlug);
  if (!found) notFound();
  const { level, units } = found;

  return (
    <div className="min-h-full bg-[#f3f4f7] text-[#1c2027] px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: 'Aulas', href: '/lessons' }, { label: level.title }]} />

        <div className="flex items-center gap-2 mt-4 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#fd3682]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#0448df]">
            {level.title}
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-title)] text-[26px] font-bold text-[#1c2027] mb-8">
          Unidades
        </h1>

        {units.length === 0 ? (
          <p className="text-sm text-[#9aa1ac]">Nenhuma unidade cadastrada ainda.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit, i) => (
              <li key={unit.id} className="relative">
                <Link
                  href={`/lessons/${level.slug}/${unit.slug}`}
                  className="group block h-full rounded-2xl border border-[#e4e6eb] bg-white px-6 py-6 hover:border-[#fd3682] transition-colors duration-200"
                >
                  <div className="flex flex-col h-full">
                    <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#9aa1ac] mb-1 pr-8">
                      Unit {i + 1}
                    </p>
                    <h3 className="font-[family-name:var(--font-title)] text-[17px] font-bold text-[#1c2027] mb-6 pr-8">
                      {unit.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[12.5px] text-[#9aa1ac]">
                        {unit._count.lessons} {unit._count.lessons === 1 ? 'lição' : 'lições'}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-[#fd3682] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
                {canEdit && <RemoveIconButton id={unit.id} deleteAction={deleteUnitAction} />}
              </li>
            ))}
            {canEdit && (
              <li>
                <AddCard action={createUnitAction} hiddenFields={{ levelId: level.id }} label="Adicionar unidade" />
              </li>
            )}
          </ul>
        )}

        {canEdit && units.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AddCard action={createUnitAction} hiddenFields={{ levelId: level.id }} label="Adicionar unidade" />
          </div>
        )}
      </div>
    </div>
  );
}
