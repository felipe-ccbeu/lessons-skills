'use client';

import { useState } from 'react';
import { setUserAiSpendCapAction, resetUserAiSpendAction } from '@/lib/admin-actions';
import { Icon } from '@/components/ui/Icon';
import type { AiUsageByUser } from '@/lib/aiUsage';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  NONE: 'Sem acesso',
};

function formatUsd(value: number) {
  return `$${value.toFixed(value < 0.01 && value > 0 ? 4 : 2)}`;
}

export function AiUsagePanel({ usage }: { usage: AiUsageByUser[] }) {
  const totalSpend = usage.reduce((sum, u) => sum + u.spendUsd, 0);

  return (
    <div>
      <div className="px-4 py-3 border-b border-[#e4e6eb] flex items-center justify-between">
        <span className="text-[12.5px] text-[#6b7280]">Gasto total estimado (todos os usuários)</span>
        <span className="text-[14px] font-semibold text-[#1c2027]">{formatUsd(totalSpend)}</span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#e4e6eb] text-left text-[11.5px] text-[#9aa1ac] uppercase tracking-wide">
            <th className="px-4 py-2 font-medium">Usuário</th>
            <th className="px-4 py-2 font-medium">Papel</th>
            <th className="px-4 py-2 font-medium">Chamadas</th>
            <th className="px-4 py-2 font-medium">Gasto estimado</th>
            <th className="px-4 py-2 font-medium">Limite (USD)</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {usage.map((u) => (
            <UsageRow key={u.userId} usage={u} />
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 text-[11.5px] text-[#9aa1ac]">
        Valores são estimativas com base em preços públicos aproximados da OpenAI — confira o gasto real em{' '}
        <span className="font-mono">platform.openai.com/usage</span>. Deixe o limite em branco para não bloquear o usuário.
      </div>
    </div>
  );
}

function UsageRow({ usage }: { usage: AiUsageByUser }) {
  const [capDraft, setCapDraft] = useState(usage.capUsd != null ? String(usage.capUsd) : '');

  return (
    <tr className="border-b border-[#f0f1f3] last:border-0">
      <td className="px-4 py-2.5">
        <div className="text-[#1c2027]">{usage.name ?? usage.email}</div>
        {usage.name && <div className="text-[11.5px] text-[#9aa1ac]">{usage.email}</div>}
      </td>
      <td className="px-4 py-2.5 text-[#6b7280]">{ROLE_LABELS[usage.role] ?? usage.role}</td>
      <td className="px-4 py-2.5 text-[#6b7280]">
        {usage.textCalls} texto · {usage.imageCalls} imagem
      </td>
      <td className="px-4 py-2.5">
        <span className={`font-medium ${usage.blocked ? 'text-[#c0392b]' : 'text-[#1c2027]'}`}>{formatUsd(usage.spendUsd)}</span>
        {usage.blocked && (
          <span
            className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#c0392b] bg-[#fdecef] rounded-full px-2 py-0.5"
            title="Bloqueado: atingiu o limite"
          >
            <Icon name="block" size={11} /> Bloqueado
          </span>
        )}
      </td>
      <td className="px-4 py-2.5">
        <form action={setUserAiSpendCapAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={usage.userId} />
          <input
            type="number"
            name="capUsd"
            min={0}
            step="0.01"
            placeholder="sem limite"
            value={capDraft}
            onChange={(e) => setCapDraft(e.target.value)}
            className="w-24 border border-[#e4e6eb] rounded-md px-2 py-1 text-[12.5px]"
          />
          <button type="submit" className="btn">
            Salvar
          </button>
        </form>
      </td>
      <td className="px-4 py-2.5 text-right">
        {usage.blocked && (
          <form action={resetUserAiSpendAction}>
            <input type="hidden" name="id" value={usage.userId} />
            <button type="submit" className="btn" title="Zera o contador de gasto deste usuário a partir de agora">
              Liberar
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}
