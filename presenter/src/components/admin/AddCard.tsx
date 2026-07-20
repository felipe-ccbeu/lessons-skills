'use client';

import { useState } from 'react';

const inputClass = 'border border-[#e4e6eb] rounded-lg px-3 py-2 text-[13px] w-full';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

function InlineForm({
  action,
  hiddenFields,
  onCancel,
}: {
  action: (formData: FormData) => void;
  hiddenFields?: Record<string, string>;
  onCancel: () => void;
}) {
  return (
    <form
      action={(formData) => {
        action(formData);
        onCancel();
      }}
      className="flex flex-col gap-2.5 h-full justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input name="title" placeholder="Título" required autoFocus className={inputClass} />
      <input name="slug" placeholder="slug" required className={inputClass} />
      <input name="order" type="number" defaultValue={0} placeholder="Ordem" className={inputClass} />
      <div className="flex items-center gap-2">
        <button type="submit" className="btn primary">
          Criar
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Card no mesmo estilo de grid (nível/unidade), com ícone "+" no lugar da seta. */
export function AddCard({
  action,
  hiddenFields,
  label,
}: {
  action: (formData: FormData) => void;
  hiddenFields?: Record<string, string>;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="h-full rounded-xl border border-[#e4e6eb] bg-white px-6 py-6">
        <InlineForm action={action} hiddenFields={hiddenFields} onCancel={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex flex-col items-center justify-center h-full min-h-[128px] rounded-2xl border-[1.5px] border-dashed border-[#c9cfe0] bg-white px-6 py-6 gap-2.5 hover:border-[#0448df] hover:bg-[#0448df]/5 transition-colors w-full"
    >
      <span className="w-8 h-8 rounded-full bg-[#f2f5ff] text-[#0448df] flex items-center justify-center">
        <PlusIcon />
      </span>
      <span className="text-[14px] font-medium text-[#0448df]">{label}</span>
    </button>
  );
}

/** Linha no mesmo estilo de lista (lesson/part), com ícone "+" no lugar do badge. */
export function AddRow({
  action,
  hiddenFields,
  label,
}: {
  action: (formData: FormData) => void;
  hiddenFields?: Record<string, string>;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded-lg border border-[#e4e6eb] bg-white px-5 py-4">
        <InlineForm action={action} hiddenFields={hiddenFields} onCancel={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-3 rounded-lg border-[1.5px] border-dashed border-[#c9cfe0] bg-white px-5 py-4 hover:border-[#0448df] hover:bg-[#0448df]/5 transition-colors w-full"
    >
      <span className="w-6 h-6 rounded-full bg-[#f2f5ff] text-[#0448df] flex items-center justify-center flex-none">
        <PlusIcon />
      </span>
      <span className="text-[13.5px] font-medium text-[#0448df]">{label}</span>
    </button>
  );
}
