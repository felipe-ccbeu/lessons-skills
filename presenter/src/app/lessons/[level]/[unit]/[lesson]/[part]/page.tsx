import { notFound } from 'next/navigation';
import { getPartBySlug } from '@/lib/lessons';
import { Slide } from '@/lib/types';
import { PresenterApp } from '@/components/PresenterApp';

type Props = { params: Promise<{ level: string; unit: string; lesson: string; part: string }> };

export default async function PartEditorPage({ params }: Props) {
  const { level: levelSlug, unit: unitSlug, lesson: lessonSlug, part: partSlug } = await params;
  const found = await getPartBySlug(levelSlug, unitSlug, lessonSlug, partSlug);
  if (!found) notFound();

  const { level, unit, lesson, part } = found;
  const slides = part.slides as Slide[];
  if (slides.length === 0) notFound();

  return (
    <PresenterApp
      partApiUrl={`/api/lessons/${levelSlug}/${unitSlug}/${lessonSlug}/${partSlug}`}
      partId={part.id}
      initialSlides={slides}
      partTitle={`${level.title} · ${unit.title} · ${lesson.title} · ${part.title}`}
      breadcrumbHref={[
        { label: 'Aulas', href: '/lessons' },
        { label: level.title, href: `/lessons/${levelSlug}` },
        { label: unit.title, href: `/lessons/${levelSlug}/${unitSlug}` },
        { label: lesson.title, href: `/lessons/${levelSlug}/${unitSlug}/${lessonSlug}` },
        { label: part.title, href: `/lessons/${levelSlug}/${unitSlug}/${lessonSlug}/${partSlug}` },
      ]}
    />
  );
}
