'use client';

import { useRef, useState, ChangeEvent, ClipboardEvent } from 'react';
import { AiSlideAction } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  /** True for an assistant reply that applied slide changes — lets the UI offer to undo it. */
  appliedActions?: boolean;
  /** Set on an assistant reply that generated/searched at least one image, e.g. "2/3". */
  imageUsage?: string;
};

type Props = {
  slideData: unknown;
  template: string;
  dragKeys: string[];
  deckOverview: { template: string; data: unknown }[];
  activeIndex: number;
  onApplyActions: (actions: AiSlideAction[]) => void;
  /** Reverts the single most recent change (from the AI or from manual editing) — the same undo stack as Ctrl+Z. */
  onUndo: () => void;
  /** Whether there's anything left to undo right now. */
  canUndo: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Cap on staged image attachments per message, to keep request payloads (and vision cost) sane. */
const MAX_ATTACHMENTS = 6;

export function ChatSidebar({
  slideData,
  template,
  dragKeys,
  deckOverview,
  activeIndex,
  onApplyActions,
  onUndo,
  canUndo,
  open,
  onOpenChange,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Index of the most recent assistant message with an active "undo this" offer, so it stops being
  // offered once the user clicks it (undoing the same message twice would revert unrelated edits).
  const [undoableIndex, setUndoableIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Reads image files into base64 data URLs and stages them (capped at MAX_ATTACHMENTS). */
  const addFiles = (files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
    for (const file of imgs) {
      const reader = new FileReader();
      reader.onload = () =>
        setAttachments((cur) => (cur.length >= MAX_ATTACHMENTS ? cur : [...cur, reader.result as string]));
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((it) => it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => !!f);
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const send = async () => {
    const text = draft.trim();
    const images = attachments;
    if ((!text && images.length === 0) || sending) return;
    setDraft('');
    setAttachments([]);
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: text, ...(images.length ? { images } : {}) };
    const nextMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(nextMessages);
    setSending(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, slideData, template, dragKeys, deckOverview, activeIndex }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao falar com a IA');
      const appliedActions = Boolean(json.actions?.length);
      if (appliedActions) onApplyActions(json.actions);
      const imageUsage = json.imagesUsed > 0 ? `${json.imagesUsed}/${json.imagesLimit} imagens usadas nesta resposta` : undefined;
      setMessages((prev) => {
        const next = [...prev, { role: 'assistant' as const, content: json.reply || '(concluído)', appliedActions, imageUsage }];
        if (appliedActions) setUndoableIndex(next.length - 1);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
    }
  };

  const handleUndoClick = (index: number) => {
    onUndo();
    setUndoableIndex((cur) => (cur === index ? null : cur));
  };

  return (
    <div className={`chat-sidebar-wrap ${open ? '' : 'collapsed'}`}>
      <button
        type="button"
        className="panel-collapse-handle panel-collapse-handle-chat"
        onClick={() => onOpenChange(!open)}
        title={open ? 'Ocultar chat da IA' : 'Mostrar chat da IA'}
        aria-label={open ? 'Ocultar chat da IA' : 'Mostrar chat da IA'}
      >
        <Icon name={open ? 'chevron_right' : 'chevron_left'} size={16} />
      </button>
      <div className="chat-sidebar" aria-hidden={!open} inert={!open || undefined}>
        <div className="chat-sidebar-header">
          <span>Assistente do slide</span>
        </div>
        <div className="chat-sidebar-messages" ref={listRef}>
          {messages.length === 0 && (
            <div className="chat-sidebar-empty">
              Peça pra mudar textos, adicionar/remover itens de listas, gerar e inserir imagens, mover blocos deste
              slide, criar um novo slide no fim do deck, ou reordenar os slides existentes. Você também pode anexar
              imagens (botão ou Ctrl+V) para a IA extrair o conteúdo delas ou colocá-las no slide.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              {m.images && m.images.length > 0 && (
                <div className="chat-msg-images">
                  {m.images.map((src, j) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={j} src={src} alt="" />
                  ))}
                </div>
              )}
              {m.content}
              {m.imageUsage && <div className="chat-msg-image-usage">{m.imageUsage}</div>}
              {i === undoableIndex && (
                <button
                  type="button"
                  className="chat-undo-btn"
                  onClick={() => handleUndoClick(i)}
                  disabled={!canUndo}
                  title="Reverter as alterações que essa resposta aplicou no slide"
                >
                  <Icon name="undo" size={13} style={{ verticalAlign: 'middle' }} /> Desfazer
                </button>
              )}
            </div>
          ))}
          {sending && <div className="chat-msg chat-msg-assistant chat-msg-pending">Pensando…</div>}
          {error && <div className="chat-msg chat-msg-error">{error}</div>}
        </div>
        {attachments.length > 0 && (
          <div className="chat-attachments">
            {attachments.map((src, i) => (
              <div key={i} className="chat-attachment">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <button
                  type="button"
                  className="chat-attachment-remove"
                  onClick={() => setAttachments((cur) => cur.filter((_, j) => j !== i))}
                  aria-label="Remover imagem"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="chat-sidebar-input">
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={onPickFiles} />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ex: troque o título por… ou anexe uma imagem"
            rows={2}
            disabled={sending}
          />
          <button
            type="button"
            className="chat-icon-btn chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || attachments.length >= MAX_ATTACHMENTS}
            title={attachments.length >= MAX_ATTACHMENTS ? 'Limite de imagens atingido' : 'Anexar imagem'}
            aria-label="Anexar imagem"
          >
            <Icon name="add_photo_alternate" size={20} />
          </button>
          <button
            type="button"
            className="chat-icon-btn chat-send-btn"
            onClick={send}
            disabled={sending || (!draft.trim() && attachments.length === 0)}
            title="Enviar"
            aria-label="Enviar"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
