'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopHeader } from '@/components/TopHeader';

type UnitSummary = { slug: string; title: string };
type SidebarUser = { name?: string | null; email?: string | null; image?: string | null; role: string };

export function LevelChrome({
  level,
  units,
  user,
  children,
}: {
  level: { slug: string; title: string };
  units: UnitSummary[];
  user: SidebarUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // /lessons/[level]/[unit]/[lesson]/[part] — the slide editor draws its own chrome, so hide the app shell.
  const segments = pathname.split('/').filter(Boolean);
  const isPartEditor = segments.length >= 5;

  if (isPartEditor) {
    return <div className="min-h-full">{children}</div>;
  }

  return (
    <div className="min-h-full">
      <TopHeader user={user} />
      <div className="flex pt-[65px]">
        <Sidebar level={level} units={units} user={user} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
