'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Slide } from '@/lib/types';
import { sampleSlides } from '@/lib/sample-slides';
import { RENDERERS } from '@/components/slides';
import { PresentationOverlay } from '@/components/PresentationOverlay';

type Props = {
  /** When provided, the app loads/saves this part's slides via the API instead of the in-memory sample deck. */
  partApiUrl?: string;
  /** DB id of this Part — required to start a live poll session from the presentation overlay. */
  partId?: string;
  initialSlides?: Slide[];
  partTitle?: string;
  breadcrumbHref?: { label: string; href: string }[];
};

export function PresenterApp({ partApiUrl, partId, initialSlides, partTitle, breadcrumbHref }: Props) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides ?? sampleSlides);
  const [activeId, setActiveId] = useState((initialSlides ?? sampleSlides)[0].id);
  const [editMode, setEditMode] = useState(true);
  const [scale, setScale] = useState(0.6);
  const [presenting, setPresenting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const active = slides.find((s) => s.id === activeId)!;
  const idx = slides.findIndex((s) => s.id === activeId);

  const updateActiveData = useCallback(
    (patch: Record<string, unknown>) => {
      setSlides((prev) =>
        prev.map((s) => (s.id === activeId ? ({ ...s, data: { ...s.data, ...patch } } as Slide) : s))
      );
    },
    [activeId]
  );

  const toggleAnswerField = useCallback(
    (key: string) => {
      setSlides((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const current = s.answerFields ?? [];
          const answerFields = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
          return { ...s, answerFields };
        })
      );
    },
    [activeId]
  );

  const skipDirtyRef = useRef(true);
  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    setDirty(true);
  }, [slides]);

  const handleSave = useCallback(async () => {
    if (!partApiUrl) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(partApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar');
      setDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }, [partApiUrl, slides]);

  useEffect(() => {
    function computeScale() {
      const el = stageWrapRef.current;
      if (!el) return;
      const availW = el.clientWidth - 48;
      const availH = el.clientHeight - 48;
      setScale(Math.min(availW / 1280, availH / 720, 1));
    }
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  useEffect(() => {
    if (presenting) return;
    function onKey(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl?.isContentEditable) return;
      const i = slides.findIndex((s) => s.id === activeId);
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (i < slides.length - 1) setActiveId(slides[i + 1].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (i > 0) setActiveId(slides[i - 1].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides, activeId, presenting]);

  const handlePptxSelected = useCallback(async (file: File) => {
    setImporting(true);
    setImportError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/pptx/convert', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao converter o arquivo');

      const newSlides: Slide[] = (json.urls as string[]).map((url, i) => ({
        id: `pptx-${Date.now()}-${i}`,
        template: 'pptxImage',
        data: { imageUrl: url, sourceFile: json.sourceFile as string, slideNumber: i + 1 },
      }));
      setSlides((prev) => [...prev, ...newSlides]);
      setActiveId(newSlides[0].id);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Falha ao importar o arquivo');
    } finally {
      setImporting(false);
    }
  }, []);

  const addPollSlide = useCallback(() => {
    const newSlide: Slide = {
      id: `poll-${Date.now()}`,
      template: 'poll',
      data: {
        breadcrumb: 'Enquete',
        question: 'Qual a forma correta?',
        options: [
          { id: `opt-${Date.now()}-1`, label: 'Opção A' },
          { id: `opt-${Date.now()}-2`, label: 'Opção B' },
        ],
      },
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveId(newSlide.id);
  }, []);

  const Renderer = RENDERERS[active.template];

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="dot" /> {partTitle ? partTitle : 'CCBEU Slides — protótipo'}
        </div>
        <div className="slide-counter">
          Slide {idx + 1} / {slides.length}
        </div>
        <div className="actions">
          {partApiUrl && (
            <button className="btn primary" disabled={saving || !dirty} onClick={handleSave}>
              {saving ? 'Salvando…' : dirty ? '💾 Salvar' : '✓ Salvo'}
            </button>
          )}
          <button className={`btn ${editMode ? 'primary' : ''}`} onClick={() => setEditMode((m) => !m)}>
            {editMode ? '✎ Modo edição' : '👁 Modo visualização'}
          </button>
          <button className="btn primary" onClick={() => setPresenting(true)}>
            ▶ Apresentar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pptx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePptxSelected(file);
              e.target.value = '';
            }}
          />
          <button className="btn" disabled={importing} onClick={() => fileInputRef.current?.click()}>
            {importing ? 'Convertendo…' : '📄 Importar .pptx'}
          </button>
          <button className="btn" onClick={addPollSlide}>
            📊 Adicionar enquete
          </button>
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([JSON.stringify(slides, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'lesson-slides.json';
              a.click();
            }}
          >
            Exportar JSON
          </button>
        </div>
      </div>

      {breadcrumbHref && (
        <div style={{ background: 'var(--chrome-bg-subtle)', borderBottom: '1px solid var(--chrome-border)', padding: '8px 18px', fontSize: 12.5 }}>
          {breadcrumbHref.map((item, i) => (
            <span key={i}>
              <a href={item.href} style={{ color: 'var(--chrome-text-muted)' }}>
                {item.label}
              </a>
              {i < breadcrumbHref.length - 1 && <span style={{ color: 'var(--chrome-text-faint)', margin: '0 6px' }}>/</span>}
            </span>
          ))}
        </div>
      )}

      {saveError && (
        <div style={{ background: '#fdecec', color: '#b3261e', padding: '8px 18px', fontSize: 12.5 }}>
          Erro ao salvar: {saveError}
        </div>
      )}

      {importError && (
        <div style={{ background: '#fdecec', color: '#b3261e', padding: '8px 18px', fontSize: 12.5 }}>
          Erro ao importar pptx: {importError}
        </div>
      )}

      <div className={`body-row ${editMode ? 'edit-mode' : 'view-mode'}`}>
        <div className="rail">
          {slides.map((s, i) => {
            const R = RENDERERS[s.template];
            return (
              <div key={s.id} className={`thumb ${s.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(s.id)}>
                <div className="thumb-inner">
                  <R data={s.data} editMode={false} onEdit={() => {}} />
                </div>
                <div className="thumb-label">{i + 1}</div>
              </div>
            );
          })}
        </div>

        <div className="stage-wrap" ref={stageWrapRef}>
          <div className="stage-scaler" style={{ transform: `scale(${scale})` }}>
            <div className="stage">
              <Renderer
                data={active.data}
                editMode={editMode}
                onEdit={updateActiveData}
                answerFields={active.answerFields ?? []}
                onToggleAnswerField={toggleAnswerField}
                revealAnswers
              />
            </div>
          </div>
        </div>

        <div className="side-panel">
          <h3>Como testar</h3>
          <div className="hint">
            <b>Modo edição</b> (ligado): clique em qualquer texto azul-realçado para editar. Passe o mouse numa
            linha da lista (slide 2) para ver o botão de remover; use &quot;+ Adicionar frase&quot; para incluir
            uma nova. No slide 3, passe o mouse na área da foto para colar uma imagem (
            <span className="kbd">Ctrl+V</span>) ou colar um link.
          </div>
          <div className="hint">
            <b>Marcar resposta</b>: passe o mouse em qualquer texto editável e clique no ícone 👁 ao lado para
            marcar (ou desmarcar) aquele campo como resposta. Na apresentação, respostas marcadas ficam escondidas
            até o professor avançar.
          </div>
          <div className="hint">
            <b>Modo apresentação</b>: nada é editável, usa <span className="kbd">←</span>/<span className="kbd">→</span>{' '}
            para navegar entre slides — é o que o professor veria em sala. Se o slide tiver uma resposta marcada,
            o primeiro <span className="kbd">→</span> revela a resposta; o próximo avança pro slide seguinte.
          </div>
          <div className="hint">
            &quot;Exportar JSON&quot; baixa o estado atual dos 3 slides — esse é o formato que, no sistema real,
            ficaria salvo no banco por aula (mesma estrutura que os <code>*.render.js</code> do pipeline já usam
            para <code>rows</code>/tokens).
          </div>
        </div>
      </div>

      {presenting && (
        <PresentationOverlay slides={slides} startIndex={idx} onExit={() => setPresenting(false)} partId={partId} />
      )}
    </div>
  );
}
