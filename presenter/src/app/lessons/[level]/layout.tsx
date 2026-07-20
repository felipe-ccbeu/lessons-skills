import { notFound } from 'next/navigation';
import { getUnits } from '@/lib/lessons';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';
import { requireUser } from '@/lib/dal';

type Props = {
  children: React.ReactNode;
  params: Promise<{ level: string }>;
};

export default async function LevelLayout({ children, params }: Props) {
  const user = await requireUser();
  const { level: levelSlug } = await params;
  const found = await getUnits(levelSlug);
  if (!found) notFound();
  const { level, units } = found;

  return (
    <div className="min-h-full">
      <TopHeader />
      <div className="flex pt-[65px]">
        <Sidebar
          level={{ slug: level.slug, title: level.title }}
          units={units.map((u) => ({ slug: u.slug, title: u.title }))}
          user={{ name: user.name, email: user.email, image: user.image, role: user.role }}
        />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
