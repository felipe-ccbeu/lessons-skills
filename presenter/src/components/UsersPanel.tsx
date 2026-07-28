'use client';

import { useState } from 'react';
import { updateUserRoleAction, deleteUserAction, impersonateUserAction } from '@/lib/admin-actions';

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
};

const ROLES = ['ADMIN', 'COORDINATOR', 'TEACHER', 'NONE'];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  NONE: 'Sem acesso',
};

// Accent per role — used for the status dot + avatar tint so the table reads at
// a glance instead of forcing a read of the select's text.
const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#fd3682',
  COORDINATOR: '#0448df',
  TEACHER: '#16a34a',
  NONE: '#9aa1ac',
};

export function UsersPanel({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  return (
    <ul className="divide-y divide-[#f0f1f3]">
      {users.map((u) => (
        <UserRowItem key={u.id} user={u} isSelf={u.id === currentUserId} />
      ))}
    </ul>
  );
}

function UserRowItem({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [role, setRole] = useState(user.role);
  const dirty = role !== user.role;

  const accent = ROLE_COLORS[role] ?? '#9aa1ac';
  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  return (
    <li className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafbfc] transition-colors">
      {/* Identity: avatar + name + email, collapses gracefully on narrow widths */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold flex-none"
          style={{ background: `${accent}1a`, color: accent }}
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium text-[#1c2027] truncate flex items-center gap-1.5">
            {user.name ?? '—'}
            {isSelf && (
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9aa1ac] bg-[#f0f1f3] rounded px-1.5 py-0.5">
                você
              </span>
            )}
          </p>
          <p className="text-[12px] text-[#9aa1ac] truncate">{user.email}</p>
        </div>
      </div>

      {/* Role editor: dot + select, with Salvar surfacing only when changed */}
      <form action={updateUserRoleAction} className="flex items-center gap-2 flex-none">
        <input type="hidden" name="id" value={user.id} />
        <span className="w-2 h-2 rounded-full flex-none" style={{ background: accent }} aria-hidden />
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-[#e4e6eb] rounded-md pl-2 pr-6 py-1.5 text-[12.5px] text-[#1c2027] bg-white
                     hover:border-[#c7cbd4] focus:border-[#0448df] focus:outline-none focus:ring-2 focus:ring-[#0448df]/15
                     transition-colors cursor-pointer"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        {dirty && (
          <button type="submit" className="btn primary text-[12.5px] py-1.5 px-3">
            Salvar
          </button>
        )}
      </form>

      {/* Joined date — hidden on smaller screens to keep the row from wrapping */}
      <span className="hidden lg:block text-[12px] text-[#9aa1ac] tabular-nums flex-none w-[84px] text-right">
        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 flex-none">
        {isSelf ? (
          <span className="text-[12px] text-[#c7cbd4] px-2">—</span>
        ) : confirming ? (
          <>
            <span className="text-[12px] text-[#6b7280] mr-1">Remover?</span>
            <form action={deleteUserAction}>
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                className="btn text-[12.5px] py-1.5 px-3"
                style={{ color: '#c0392b', borderColor: '#e5a3a3' }}
              >
                Confirmar
              </button>
            </form>
            <button type="button" className="btn text-[12.5px] py-1.5 px-3" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <form action={impersonateUserAction}>
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                title="Ver o app com as permissões deste usuário"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#e4e6eb] bg-white px-2.5 py-1.5
                           text-[12.5px] font-medium text-[#1c2027] hover:bg-[#f7f8fa] hover:border-[#c7cbd4] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Ver como
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              title="Remover usuário"
              aria-label={`Remover ${user.name ?? user.email}`}
              className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-transparent
                         text-[#9aa1ac] hover:text-[#c0392b] hover:border-[#e5a3a3] hover:bg-[#fdecef] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </>
        )}
      </div>
    </li>
  );
}
