import { useCallback, useRef, useState } from 'react';
import { CustomHtmlData } from '@/lib/types';

type Props = {
  data: CustomHtmlData;
  onEdit: (patch: Partial<CustomHtmlData>) => void;
  editMode: boolean;
};

// Renders raw, user-supplied HTML live inside an isolated iframe (so the
// imported page's own <style> rules never leak into the app's CSS). In edit
// mode the iframe's own <body> is made contentEditable — click straight into
// the rendered text and type, same click-to-edit feel as the structured
// templates — and every input event serializes the iframe's full document
// back into `data.html` as a string. A small toggle still exposes the raw
// HTML in a textarea for edits contentEditable can't express (attributes,
// new elements, restructuring).
export function CustomHtmlSlide({ data, onEdit, editMode }: Props) {
  const [editingSource, setEditingSource] = useState(false);
  const showSourceEditor = editMode && editingSource;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    doc.body.contentEditable = editMode ? 'true' : 'false';
  }, [editMode]);

  const commitFromIframe = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    const html = `<!doctype html>\n${doc.documentElement.outerHTML}`;
    if (html !== data.html) onEdit({ html });
  }, [data.html, onEdit]);

  return (
    <div style={{ position: 'relative', width: 1280, height: 720, background: '#fff', overflow: 'hidden' }}>
      {showSourceEditor ? (
        <textarea
          value={data.html}
          onChange={(e) => onEdit({ html: e.target.value })}
          spellCheck={false}
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            padding: 16,
            border: 'none',
            resize: 'none',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            fontSize: '11px',
            lineHeight: 1.5,
            color: '#1c2027',
            background: '#f7f8fa',
          }}
        />
      ) : (
        <iframe
          ref={iframeRef}
          srcDoc={data.html}
          title={data.sourceFile}
          sandbox={editMode ? 'allow-same-origin' : ''}
          onLoad={handleIframeLoad}
          onInput={editMode ? commitFromIframe : undefined}
          onBlur={editMode ? commitFromIframe : undefined}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      )}
      {editMode && (
        <button
          type="button"
          onClick={() => setEditingSource((v) => !v)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid #ecedf0',
            background: '#fff',
            color: '#1c2027',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showSourceEditor ? 'Ver preview' : 'Editar HTML'}
        </button>
      )}
    </div>
  );
}
