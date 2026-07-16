import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUnits } from '@/lib/lessons';
import { Breadcrumb } from '@/components/Breadcrumb';

type Props = { params: Promise<{ level: string }> };

export default async function UnitsPage({ params }: Props) {
  const { level: levelSlug } = await params;
  const found = await getUnits(levelSlug);
  if (!found) notFound();
  const { level, units } = found;

  return (
    <div className="min-h-full bg-[#1c1f26] text-[#dfe2e8] px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: 'Aulas', href: '/lessons' }, { label: level.title }]} />
        <h1 className="text-lg font-bold mt-2 mb-8">{level.title}</h1>

        {units.length === 0 ? (
          <p className="text-sm text-[#9aa1ac]">Nenhuma unidade cadastrada ainda.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((unit) => (
              <li key={unit.id}>
                <Link
                  href={`/lessons/${level.slug}/${unit.slug}`}
                  className="group block h-full rounded-xl border border-[#3a3f4b] bg-[#20232c] px-5 py-5 hover:bg-[#2a2e38] hover:border-[#4a5164] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-[16px]">{unit.title}</span>
                    <span className="flex-none w-9 h-9 rounded-lg bg-[#fd3682]/15 text-[#ff7fae] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 9h18M8 4v5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] text-[#9aa1ac]">
                    {unit._count.lessons} {unit._count.lessons === 1 ? 'lição' : 'lições'}
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
