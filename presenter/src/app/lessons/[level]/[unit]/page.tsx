import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLessons } from '@/lib/lessons';
import { Breadcrumb } from '@/components/Breadcrumb';

type Props = { params: Promise<{ level: string; unit: string }> };

export default async function LessonsPage({ params }: Props) {
  const { level: levelSlug, unit: unitSlug } = await params;
  const found = await getLessons(levelSlug, unitSlug);
  if (!found) notFound();
  const { level, unit, lessons } = found;

  return (
    <div className="min-h-full bg-[#1c1f26] text-[#dfe2e8] px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Aulas', href: '/lessons' },
            { label: level.title, href: `/lessons/${level.slug}` },
            { label: unit.title },
          ]}
        />
        <h1 className="text-lg font-bold mt-2 mb-8">
          {level.title} · {unit.title}
        </h1>

        {lessons.length === 0 ? (
          <p className="text-sm text-[#9aa1ac]">Nenhuma lição cadastrada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/lessons/${level.slug}/${unit.slug}/${lesson.slug}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[#3a3f4b] bg-[#20232c] px-5 py-4 hover:bg-[#2a2e38] hover:border-[#4a5164] transition-colors"
                >
                  <span className="font-semibold text-[15px]">{lesson.title}</span>
                  <span className="flex-none text-[12px] text-[#9aa1ac] bg-[#14161c] border border-[#3a3f4b] rounded-full px-2.5 py-1">
                    {lesson._count.parts} {lesson._count.parts === 1 ? 'part' : 'parts'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
