import { notFound } from 'next/navigation';
import { getClassSessionWithPart } from '@/lib/classSessions';
import { Slide } from '@/lib/types';
import { ClassSessionView } from './ClassSessionView';

type Props = { params: Promise<{ code: string }> };

export default async function ClassSessionPage({ params }: Props) {
  const { code } = await params;
  const session = await getClassSessionWithPart(code);
  if (!session) notFound();

  const slides = session.part.slides as Slide[];
  const currentIndex = session.currentSlideId ? slides.findIndex((s) => s.id === session.currentSlideId) : -1;

  return <ClassSessionView code={code} initialIndex={currentIndex} totalSlides={slides.length} />;
}
