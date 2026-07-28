'use client';

import { useRef, useState } from 'react';
import { AiSlideAction } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Props = {
  slideData: unknown;
  template: string;
  dragKeys: string[];
  deckOverview: { template: string; data: unknown }[];
  activeIndex: number;
  onApplyActions: (actions: AiSlideAction[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChatSidebar({
  slideData,
  template,
  dragKeys,
  deckOverview,
  activeIndex,
  onApplyActions,
  open,
  onOpenChange,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
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
      if (json.actions?.length) onApplyActions(json.actions);
      setMessages((prev) => [...prev, { role: 'assistant', content: json.reply || '(concluído)' }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
    }
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
              slide, criar um novo slide no fim do deck, ou reordenar os slides existentes.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              {m.content}
            </div>
          ))}
          {sending && <div className="chat-msg chat-msg-assistant chat-msg-pending">Pensando…</div>}
          {error && <div className="chat-msg chat-msg-error">{error}</div>}
        </div>
        <div className="chat-sidebar-input">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ex: troque o título por..."
            rows={2}
            disabled={sending}
          />
          <button type="button" onClick={send} disabled={sending || !draft.trim()}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
