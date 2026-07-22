'use client';

import { useState } from 'react';

export function RemoveIconButton({
  id,
  deleteAction,
  positionClassName,
}: {
  id: string;
  deleteAction: (formData: FormData) => void;
  /** Positioning classes only (e.g. "absolute top-3 right-3"); defaults to top-right corner. */
  positionClassName?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const position = positionClassName ?? 'absolute top-4 right-4';

  if (confirming) {
    return (
      <div className={`${position} z-10 flex items-center gap-1.5`} onClick={(e) => e.stopPropagation()}>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="w-[30px] h-[30px] rounded-full bg-[#c0392b] text-white flex items-center justify-center hover:bg-[#a93226] transition-colors"
            title="Confirmar remoção"
            aria-label="Confirmar remoção"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="w-[30px] h-[30px] rounded-full border border-[#ecedf0] bg-white text-[#6b7280] flex items-center justify-center hover:bg-[#f7f8fa] transition-colors"
          title="Cancelar"
          aria-label="Cancelar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setConfirming(true);
      }}
      className={`${position} z-10 w-8 h-8 rounded-full border border-[#ecedf0] bg-white text-[#6b7280] flex items-center justify-center hover:bg-[#f7f8fa] hover:text-[#c0392b] transition-colors`}
      title="Remover"
      aria-label="Remover"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    </button>
  );
}
