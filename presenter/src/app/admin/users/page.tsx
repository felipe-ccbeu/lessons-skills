import { requireRole } from '@/lib/dal';
import { getUsers } from '@/lib/users';
import { UsersPanel } from '@/components/UsersPanel';
import { Breadcrumb } from '@/components/Breadcrumb';

export default async function AdminUsersPage() {
  const user = await requireRole(['ADMIN']);
  const users = await getUsers();

  return (
    <div className="min-h-full bg-[#f3f4f7] text-[#1c2027] px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[{ label: 'Aulas', href: '/lessons' }, { label: 'Usuários' }]} />

        <div className="flex items-end justify-between mt-2 mb-6">
          <div>
            <h1 className="font-[family-name:var(--font-title)] text-[22px] font-bold text-[#1c2027]">Usuários</h1>
            <p className="text-[13px] text-[#9aa1ac] mt-0.5">
              Gerencie papéis e acessos · {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e4e6eb] bg-white shadow-sm overflow-hidden">
          <UsersPanel users={users} currentUserId={user.id} />
        </div>

        <p className="text-[12px] text-[#9aa1ac] mt-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">info</span>
          &ldquo;Ver como&rdquo; abre o app com as permissões daquele usuário; use a faixa inferior para voltar ao seu acesso.
        </p>
      </div>
    </div>
  );
}
