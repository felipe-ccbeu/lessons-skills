'use client';

import { useCallback, useState, CSSProperties, ClipboardEvent, KeyboardEvent } from 'react';

type ImageSlotProps = {
  url: string;
  onChange: (url: string) => void;
  style?: CSSProperties;
  editMode: boolean;
  label?: string;
};

export function ImageSlot({
  url,
  onChange,
  style,
  editMode,
  label = 'Colar imagem (Ctrl+V) ou link',
}: ImageSlotProps) {
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState('');

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      if (!editMode) return;
      const items = e.clipboardData?.items || [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => onChange(reader.result as string);
          reader.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
      const text = e.clipboardData?.getData('text');
      if (text) {
        onChange(text);
        setShowInput(false);
      }
    },
    [editMode, onChange]
  );

  const commitDraft = () => {
    if (draft) onChange(draft);
    setShowInput(false);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitDraft();
    if (e.key === 'Escape') {
      setShowInput(false);
      setDraft('');
    }
  };

  return (
    <div
      className="img-slot"
      style={style}
      tabIndex={editMode ? 0 : -1}
      onPaste={handlePaste}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <div className="img-placeholder">
          📷
          <br />
          sem imagem
        </div>
      )}
      {editMode && (
        <div className="img-overlay">
          {!showInput ? (
            <>
              <div>{label}</div>
              <button
                type="button"
                className="btn"
                style={{ fontSize: '10pt' }}
                onClick={() => setShowInput(true)}
              >
                Colar link…
              </button>
            </>
          ) : (
            <input
              autoFocus
              placeholder="https://..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitDraft}
            />
          )}
        </div>
      )}
    </div>
  );
}
