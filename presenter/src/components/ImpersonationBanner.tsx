import { getCurrentUser } from '@/lib/dal';
import { stopImpersonatingAction } from '@/lib/admin-actions';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  NONE: 'Sem acesso',
};

// Fixed bar shown across the whole app whenever an admin is viewing "as" another
// user. Sits at the bottom to stay clear of the fixed TopHeader; a presentation
// overlay (z-index 1000) intentionally covers it. Renders nothing when not
// impersonating, so it's safe to mount unconditionally in the root layout.
export async function ImpersonationBanner() {
  const user = await getCurrentUser();
  if (!user?.impersonatedBy) return null;

  const label = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-center gap-3 flex-wrap
                 border-t border-[#f0c36d] bg-[#fff7e6] px-4 py-2 text-[13px] text-[#7a5b12] shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
      role="status"
    >
      <span className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[18px]">visibility</span>
        Vendo como <strong className="font-semibold">{user.name ?? user.email}</strong>
        <span className="text-[#a07d2c]">({label})</span>
      </span>
      <form action={stopImpersonatingAction}>
        <button
          type="submit"
          className="rounded-md border border-[#e0b050] bg-white px-3 py-1 text-[12.5px] font-medium text-[#7a5b12]
                     hover:bg-[#fdf3dc] transition-colors"
        >
          Voltar ao meu acesso
        </button>
      </form>
    </div>
  );
}
