'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RATINGS, type CJStep, type CJRating, type StepsState } from './types';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  X,
  ClipboardList,
} from 'lucide-react';

// ─── Props ───
interface CJTrackerProps {
  steps: CJStep[];
  scenarioName?: string;
  onChange?: (state: StepsState) => void;
}

// ─── Helpers ───
function formatDate(): string {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildReport(
  steps: CJStep[],
  state: StepsState,
  scenarioName: string,
): string {
  const lines: string[] = [
    '═══ CJ-трекер: Отчёт ═══',
    `Дата: ${formatDate()}`,
    `Сценарий: ${scenarioName}`,
    '',
  ];
  steps.forEach((s, i) => {
    const d = state[s.id];
    lines.push(`Шаг ${i + 1}: ${s.label}`);
    lines.push(`Оценка: ${d?.rating ? `${d.rating.emoji} ${d.rating.label}` : 'не оценён'}`);
    lines.push(`Комментарий: ${d?.comment?.trim() || '—'}`);
    lines.push('');
  });
  return lines.join('\n');
}

// ─── Component ───
export default function CJTracker({
  steps,
  scenarioName = 'Не указан',
  onChange,
}: CJTrackerProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [state, setState] = useState<StepsState>(() => {
    const init: StepsState = {};
    steps.forEach((s) => { init[s.id] = { rating: null, comment: '' }; });
    return init;
  });
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Notify parent
  useEffect(() => { onChange?.(state); }, [state, onChange]);

  // Close rating panel on outside click (desktop only)
  useEffect(() => {
    if (!expandedStep) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpandedStep(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expandedStep]);

  // ── Actions ──
  const selectRating = useCallback((stepId: string, rating: CJRating | null) => {
    setState((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], rating: prev[stepId]?.rating?.value === rating?.value ? null : rating },
    }));
  }, []);

  const setComment = useCallback((stepId: string, comment: string) => {
    setState((prev) => ({ ...prev, [stepId]: { ...prev[stepId], comment } }));
  }, []);

  const handleExportTxt = useCallback(() => {
    const report = buildReport(steps, state, scenarioName);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cj-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [steps, state, scenarioName]);

  const handleCopy = useCallback(async () => {
    const report = buildReport(steps, state, scenarioName);
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [steps, state, scenarioName]);

  // ── Step states ──
  const isRated = (id: string) => state[id]?.rating !== null;
  const isCurrent = (id: string) => expandedStep === id;

  // ── Render ──
  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full bg-stone-50 border-l border-stone-300 font-sans text-stone-700 select-none"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-stone-100 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <ClipboardList className="h-3.5 w-3.5" />
          <span className="font-semibold text-stone-600">CJ-трекер</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-stone-200 transition-colors text-stone-500 hover:text-stone-700"
            title="Копировать отчёт"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleExportTxt}
            className="p-1 rounded hover:bg-stone-200 transition-colors text-stone-500 hover:text-stone-700"
            title="Скачать отчёт .txt"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPanelOpen((p) => !p)}
            className="p-1 rounded hover:bg-stone-200 transition-colors text-stone-500 hover:text-stone-700"
            title={panelOpen ? 'Свернуть' : 'Развернуть'}
          >
            {panelOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] text-stone-400 italic leading-tight">
          Панель исследования (не часть продукта)
        </p>
      </div>

      {/* ── Body ── */}
      {panelOpen && (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {/* Steps list */}
          {steps.map((step, idx) => {
            const rated = isRated(step.id);
            const current = isCurrent(step.id);
            const data = state[step.id];

            return (
              <div key={step.id} className="rounded-md border border-stone-200 bg-white overflow-hidden">
                {/* Step badge */}
                <button
                  onClick={() => setExpandedStep((prev) => (prev === step.id ? null : step.id))}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs transition-colors ${
                    current
                      ? 'bg-amber-50 border-b border-stone-200'
                      : 'hover:bg-stone-50'
                  }`}
                >
                  {/* Number badge */}
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      rated
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : current
                        ? 'bg-amber-100 border-amber-400 text-amber-700'
                        : 'bg-stone-100 border-stone-300 text-stone-400'
                    }`}
                  >
                    {rated ? '✓' : idx + 1}
                  </span>

                  <span className={`flex-1 truncate ${current ? 'font-semibold text-stone-800' : 'text-stone-600'}`}>
                    {step.label}
                  </span>

                  {rated && data?.rating && (
                    <span className="shrink-0 text-sm" title={data.rating.label}>{data.rating.emoji}</span>
                  )}

                  {current ? (
                    <X className="shrink-0 h-3 w-3 text-stone-400" />
                  ) : (
                    <ChevronDown className={`shrink-0 h-3 w-3 text-stone-400 transition-transform ${current ? 'rotate-180' : ''}`} />
                  )}
                </button>

                {/* Rating panel */}
                {current && (
                  <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-stone-100">
                    {/* Emoji buttons */}
                    <div className="flex gap-1">
                      {RATINGS.map((r) => {
                        const selected = data?.rating?.value === r.value;
                        return (
                          <button
                            key={r.value}
                            onClick={() => selectRating(step.id, r)}
                            title={r.label}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md border text-sm transition-all ${
                              selected
                                ? 'border-amber-400 bg-amber-50 shadow-sm scale-105'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[9px] leading-tight text-stone-500 truncate w-full text-center">
                              {r.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Comment */}
                    <textarea
                      value={data?.comment || ''}
                      onChange={(e) => setComment(step.id, e.target.value)}
                      placeholder="Что было неочевидно? Что вызвало затруднение?"
                      className="w-full text-xs p-2 rounded-md border border-stone-200 bg-stone-50 text-stone-700 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Export buttons (bottom) */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button
              onClick={handleExportTxt}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border border-stone-300 bg-white text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать отчёт
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
