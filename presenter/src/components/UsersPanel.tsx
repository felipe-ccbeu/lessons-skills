'use client';

import { useState } from 'react';
import { updateUserRoleAction, deleteUserAction } from '@/lib/admin-actions';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
};

const ROLES = ['ADMIN', 'COORDINATOR', 'TEACHER', 'NONE'];

export function UsersPanel({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-[#e4e6eb] text-left text-[11.5px] text-[#9aa1ac] uppercase tracking-wide">
          <th className="px-4 py-2 font-medium">Email</th>
          <th className="px-4 py-2 font-medium">Nome</th>
          <th className="px-4 py-2 font-medium">Papel</th>
          <th className="px-4 py-2 font-medium">Desde</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <UserRowItem key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </tbody>
    </table>
  );
}

function UserRowItem({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <tr className="border-b border-[#f0f1f3] last:border-0">
      <td className="px-4 py-2.5 text-[#1c2027]">{user.email}</td>
      <td className="px-4 py-2.5 text-[#6b7280]">{user.name ?? '—'}</td>
      <td className="px-4 py-2.5">
        <form action={updateUserRoleAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            className="border border-[#e4e6eb] rounded-md px-2 py-1 text-[12.5px]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" className="btn">
            Salvar
          </button>
        </form>
      </td>
      <td className="px-4 py-2.5 text-[#9aa1ac]">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
      <td className="px-4 py-2.5 text-right">
        {isSelf ? (
          <span className="text-[11.5px] text-[#9aa1ac]">você</span>
        ) : confirming ? (
          <span className="flex items-center gap-1 justify-end">
            <form action={deleteUserAction}>
              <input type="hidden" name="id" value={user.id} />
              <button type="submit" className="btn" style={{ color: '#c0392b', borderColor: '#e5a3a3' }}>
                Confirmar
              </button>
            </form>
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirming(true)}>
            Remover
          </button>
        )}
      </td>
    </tr>
  );
}
