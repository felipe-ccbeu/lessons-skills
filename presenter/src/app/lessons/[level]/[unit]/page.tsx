import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLessons } from '@/lib/lessons';
import { Breadcrumb } from '@/components/Breadcrumb';
import { requireUser } from '@/lib/dal';
import { AddRow } from '@/components/admin/AddCard';
import { RemoveIconButton } from '@/components/admin/RemoveIconButton';
import { createLessonAction, deleteLessonAction } from '@/lib/admin-actions';

type Props = { params: Promise<{ level: string; unit: string }> };

export default async function LessonsPage({ params }: Props) {
  const user = await requireUser();
  const canEdit = user.role === 'ADMIN' || user.role === 'COORDINATOR';
  const { level: levelSlug, unit: unitSlug } = await params;
  const found = await getLessons(levelSlug, unitSlug);
  if (!found) notFound();
  const { level, unit, lessons } = found;

  return (
    <div className="min-h-full bg-[#f3f4f7] text-[#1c2027] px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Aulas', href: '/lessons' },
            { label: level.title, href: `/lessons/${level.slug}` },
            { label: unit.title },
          ]}
        />
        <div className="flex items-center gap-2 mt-4 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#fd3682]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#0448df]">{level.title}</span>
        </div>
        <h1 className="font-[family-name:var(--font-title)] text-[26px] font-bold text-[#1c2027] mb-8">
          {unit.title}
        </h1>

        {lessons.length === 0 ? (
          <p className="text-sm text-[#9aa1ac]">Nenhuma lição cadastrada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="relative">
                <Link
                  href={`/lessons/${level.slug}/${unit.slug}/${lesson.slug}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[#e4e6eb] bg-white pl-5 pr-14 py-4 hover:border-[#fd3682] transition-colors"
                >
                  <span className="font-semibold text-[15px] pr-8">{lesson.title}</span>
                  <span className="flex-none text-[12px] text-[#6b7280] bg-[#f3f4f7] border border-[#e4e6eb] rounded-full px-2.5 py-1">
                    {lesson._count.parts} {lesson._count.parts === 1 ? 'part' : 'parts'}
                  </span>
                </Link>
                {canEdit && (
                  <RemoveIconButton
                    id={lesson.id}
                    deleteAction={deleteLessonAction}
                    positionClassName="absolute top-1/2 -translate-y-1/2 right-3"
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="mt-2">
            <AddRow action={createLessonAction} hiddenFields={{ unitId: unit.id }} label="Adicionar lesson" />
          </div>
        )}
      </div>
    </div>
  );
}
