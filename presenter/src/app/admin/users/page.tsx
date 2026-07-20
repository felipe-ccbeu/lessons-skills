import { requireRole } from '@/lib/dal';
import { getUsers } from '@/lib/users';
import { UsersPanel } from '@/components/UsersPanel';
import { Breadcrumb } from '@/components/Breadcrumb';

export default async function AdminUsersPage() {
  const user = await requireRole(['ADMIN']);
  const users = await getUsers();

  return (
    <div className="min-h-full bg-[#f3f4f7] text-[#1c2027] px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Aulas', href: '/lessons' }, { label: 'Usuários' }]} />
        <h1 className="text-lg font-bold mt-2 mb-8">Usuários</h1>

        <div className="rounded-xl border border-[#e4e6eb] bg-white shadow-sm overflow-hidden">
          <UsersPanel users={users} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
