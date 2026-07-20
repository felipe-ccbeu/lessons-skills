'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignOutButton } from '@/components/SignOutButton';

type UnitSummary = { slug: string; title: string };
type LessonSummary = { slug: string; title: string };
type SidebarUser = { name?: string | null; email?: string | null; image?: string | null; role: string };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  NONE: 'Sem acesso',
};

export function Sidebar({
  level,
  units,
  user,
}: {
  level: { slug: string; title: string };
  units: UnitSummary[];
  user: SidebarUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const segments = pathname.split('/').filter(Boolean); // ['lessons', level, unit?, lesson?, part?]
  const activeUnitSlug = segments[2];
  const activeLessonSlug = segments[3];

  const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, LessonSummary[]>>({});

  useEffect(() => {
    if (!activeUnitSlug || lessonsByUnit[activeUnitSlug]) return;
    let cancelled = false;
    fetch(`/api/lessons/${level.slug}/${activeUnitSlug}`)
      .then((res) => (res.ok ? res.json() : { lessons: [] }))
      .then((data) => {
        if (!cancelled) setLessonsByUnit((prev) => ({ ...prev, [activeUnitSlug]: data.lessons ?? [] }));
      })
      .catch(() => {
        if (!cancelled) setLessonsByUnit((prev) => ({ ...prev, [activeUnitSlug]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [activeUnitSlug, level.slug, lessonsByUnit]);

  const activeLessons = activeUnitSlug ? lessonsByUnit[activeUnitSlug] ?? [] : [];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5 border-b border-[#e4e6eb]">
        <Link
          href="/lessons"
          className="flex items-center gap-1.5 mb-4 text-[12.5px] text-[#9aa1ac] hover:text-[#1c2027] transition-colors"
        >
          ← Todos os níveis
        </Link>
        <p className="font-[family-name:var(--font-title)] font-bold text-[15px] text-[#1c2027]">{level.title}</p>
        <p className="text-[12px] text-[#9aa1ac] mt-0.5">
          {units.length} {units.length === 1 ? 'unidade' : 'unidades'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {units.map((unit, i) => {
            const isActive = unit.slug === activeUnitSlug;
            return (
              <li key={unit.slug}>
                <Link
                  href={`/lessons/${level.slug}/${unit.slug}`}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                    isActive ? 'bg-[#fd3682]/10 text-[#fd3682]' : 'text-[#6b7280] hover:bg-[#f7f8fa] hover:text-[#1c2027]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[18px] flex-none"
                    style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
                  >
                    folder
                  </span>
                  <span className="min-w-0">
                    <p
                      className={`text-[10.5px] font-semibold uppercase tracking-wide ${
                        isActive ? 'text-[#fd3682]/70' : 'text-[#9aa1ac]'
                      }`}
                    >
                      Unit {i + 1}
                    </p>
                    <p className="font-[family-name:var(--font-title)] text-[13.5px] font-semibold leading-snug truncate">
                      {unit.title}
                    </p>
                  </span>
                </Link>

                {isActive && activeLessons.length > 0 && (
                  <ul className="mt-1 ml-3 pl-3 border-l border-[#e4e6eb] flex flex-col gap-0.5">
                    {activeLessons.map((lesson) => {
                      const lessonActive = lesson.slug === activeLessonSlug;
                      return (
                        <li key={lesson.slug}>
                          <Link
                            href={`/lessons/${level.slug}/${unit.slug}/${lesson.slug}`}
                            className={`block rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                              lessonActive
                                ? 'bg-[#fd3682]/10 text-[#fd3682] font-medium'
                                : 'text-[#6b7280] hover:bg-[#f7f8fa] hover:text-[#1c2027]'
                            }`}
                          >
                            {lesson.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {user.role === 'ADMIN' && (
        <Link
          href="/admin/users"
          className="mx-4 mb-3 rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-[12.5px] font-medium text-[#1c2027] hover:bg-[#f7f8fa] hover:border-[#c7cbd4] transition-colors text-center"
        >
          Usuários
        </Link>
      )}

      <div className="mx-4 mb-4 pt-3 border-t border-[#e4e6eb] flex items-center gap-2.5">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="w-8 h-8 rounded-full flex-none" />
        ) : (
          <span className="w-8 h-8 rounded-full bg-[#0448df]/10 text-[#0448df] flex items-center justify-center text-[13px] font-semibold flex-none">
            {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-[#1c2027] truncate">{user.name ?? user.email}</p>
          <p className="text-[11px] text-[#9aa1ac]">{ROLE_LABELS[user.role] ?? user.role}</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <SignOutButton className="btn w-full flex items-center justify-center" />
      </div>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-[76px] left-3 z-30 w-9 h-9 rounded-lg border border-[#e4e6eb] bg-white shadow-sm flex items-center justify-center text-[#1c2027]"
        aria-label="Abrir navegação"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      <aside className="hidden lg:block w-[280px] flex-none border-r border-[#e4e6eb] bg-white sticky top-[65px] h-[calc(100vh-65px)]">
        {nav}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 top-[65px] z-40 flex">
          <div className="w-[280px] flex-none bg-white h-full shadow-xl">{nav}</div>
          <button
            type="button"
            aria-label="Fechar navegação"
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
