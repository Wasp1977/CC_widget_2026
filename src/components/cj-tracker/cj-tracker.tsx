'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { type CJStep, type Feasibility, type StepsState } from './types';
import {
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  ClipboardList,
  Loader2,
  User,
  Mail,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Sparkles,
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
  participantName: string,
  participantEmail: string,
  steps: CJStep[],
  state: StepsState,
  scenarioName: string,
): string {
  const lines: string[] = [
    '\u2550\u2550\u2550 Описание виджетов: Отчёт \u2550\u2550\u2550',
    `Дата: ${formatDate()}`,
    `Сценарий: ${scenarioName}`,
  ];
  if (participantName.trim()) {
    lines.push(`Участник: ${participantName.trim()}`);
  }
  if (participantEmail.trim()) {
    lines.push(`Почта: ${participantEmail.trim()}`);
  }
  lines.push('');
  lines.push('\u2500\u2500 Виджеты и оценка реализуемости \u2500\u2500');
  lines.push('');
  steps.forEach((s, i) => {
    const d = state[s.id];
    const feasLabel = d?.feasibility === 'can-do' ? 'Сможем сделать' : d?.feasibility === 'cannot-do' ? 'Невозможно сделать' : 'не оценено';
    lines.push(`Виджет ${i + 1}: ${s.label}`);
    if (s.tag) lines.push(`  Тип: ${s.tag}`);
    if (s.periods && s.periods.length > 0) lines.push(`  Периоды: ${s.periods.join(', ')}`);
    lines.push(`  Описание: ${s.description}`);
    lines.push(`  Оценка: ${feasLabel}`);
    if (d?.comment?.trim()) {
      lines.push(`  Комментарий: ${d.comment.trim()}`);
    }
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
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [state, setState] = useState<StepsState>(() => {
    const init: StepsState = {};
    steps.forEach((s) => { init[s.id] = { feasibility: null, comment: '' }; });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Notify parent
  useEffect(() => { onChange?.(state); }, [state, onChange]);

  // ── Computed ──
  const allAssessed = steps.every((s) => state[s.id]?.feasibility !== null);
  const assessedCount = steps.filter((s) => state[s.id]?.feasibility !== null).length;
  const canDoCount = steps.filter((s) => state[s.id]?.feasibility === 'can-do').length;
  const cannotDoCount = steps.filter((s) => state[s.id]?.feasibility === 'cannot-do').length;

  // ── Actions ──
  const setFeasibility = useCallback((stepId: string, f: Feasibility) => {
    setState((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], feasibility: prev[stepId]?.feasibility === f ? null : f },
    }));
  }, []);

  const setComment = useCallback((stepId: string, comment: string) => {
    setState((prev) => ({ ...prev, [stepId]: { ...prev[stepId], comment } }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!allAssessed || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const report = buildReport(participantName, participantEmail, steps, state, scenarioName);
      const payload = {
        participantName: participantName.trim(),
        participantEmail: participantEmail.trim(),
        scenarioName,
        steps: steps.map((s) => ({ id: s.id, label: s.label, description: s.description, tag: s.tag, periods: s.periods })),
        state,
        reportText: report,
        submittedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Ошибка сервера');
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setSubmitting(false);
    }
  }, [allAssessed, submitting, participantName, participantEmail, steps, state, scenarioName]);

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
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-semibold text-stone-600">Описание виджетов</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanelOpen((p) => !p)}
            className="p-1 rounded hover:bg-stone-200 transition-colors text-stone-500 hover:text-stone-700"
            title={panelOpen ? 'Свернуть' : 'Развернуть'}
          >
            {panelOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="px-3 pb-2 border-b border-stone-200 bg-stone-100/50">
        <p className="text-[11px] text-stone-500 leading-snug">
          Оцените каждый виджет: можно ли его реализовать? Добавьте комментарии и идеи.
        </p>
      </div>

      {/* ── Disclaimer ── */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] text-stone-400 italic leading-tight">
          Панель оценки (не часть продукта)
        </p>
      </div>

      {/* ── Body ── */}
      {panelOpen && (
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {/* Participant info */}
          <div className="space-y-1.5 pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-stone-400 shrink-0" />
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Имя (необязательно)"
                className="flex-1 text-xs px-2 py-1.5 rounded-md border border-stone-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-stone-400 shrink-0" />
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder="Почтовый адрес (необязательно)"
                className="flex-1 text-xs px-2 py-1.5 rounded-md border border-stone-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Progress indicator */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-stone-400">
              <div className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${steps.length > 0 ? (assessedCount / steps.length) * 100 : 0}%` }}
                />
              </div>
              <span>{assessedCount}/{steps.length}</span>
            </div>
            {assessedCount > 0 && (
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {canDoCount} сможем
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="h-3 w-3" />
                  {cannotDoCount} невозможно
                </span>
              </div>
            )}
          </div>

          {/* Widget cards */}
          {steps.map((step, idx) => {
            const data = state[step.id];
            const isAssessed = data?.feasibility !== null;
            const isCanDo = data?.feasibility === 'can-do';
            const isCannotDo = data?.feasibility === 'cannot-do';

            return (
              <div
                key={step.id}
                className={`rounded-lg border overflow-hidden transition-all ${
                  submitted
                    ? 'border-stone-200 bg-stone-100/50'
                    : isAssessed
                    ? isCanDo
                      ? 'border-emerald-200 bg-white'
                      : 'border-red-200 bg-white'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                {/* Card header */}
                <div className="px-3 pt-2.5 pb-2">
                  {/* Row 1: number + label + tag */}
                  <div className="flex items-start gap-2 mb-1.5">
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                        isAssessed
                          ? isCanDo
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                            : 'bg-red-100 border-red-400 text-red-700'
                          : 'bg-stone-100 border-stone-300 text-stone-500'
                      }`}
                    >
                      {isAssessed ? (isCanDo ? '\u2713' : '\u2717') : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-800 leading-tight">{step.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {step.tag && (
                          <span className="text-[10px] px-1.5 py-0 rounded bg-stone-200 text-stone-500 font-medium">
                            {step.tag}
                          </span>
                        )}
                        {step.periods && step.periods.length > 0 && (
                          <span className="text-[10px] text-stone-400">
                            {step.periods.join(' / ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-stone-600 leading-relaxed ml-8">
                    {step.description}
                  </p>
                </div>

                {/* Feasibility buttons + comment (only if not submitted) */}
                {!submitted && (
                  <div className="px-3 pb-2.5 space-y-2 border-t border-stone-100 pt-2">
                    {/* Two assessment buttons */}
                    <div className="flex gap-2 ml-8">
                      <button
                        onClick={() => setFeasibility(step.id, 'can-do')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md font-medium border transition-all ${
                          isCanDo
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Сможем сделать
                      </button>
                      <button
                        onClick={() => setFeasibility(step.id, 'cannot-do')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md font-medium border transition-all ${
                          isCannotDo
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Невозможно сделать
                      </button>
                    </div>

                    {/* Comment */}
                    <div className="ml-8">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3 text-stone-400" />
                        <span className="text-[10px] text-stone-400 font-medium">Комментарий</span>
                      </div>
                      <textarea
                        value={data?.comment || ''}
                        onChange={(e) => setComment(step.id, e.target.value)}
                        placeholder="Идеи, замечания, предложения..."
                        className="w-full text-xs p-2 rounded-md border border-stone-200 bg-stone-50 text-stone-700 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {/* Submitted state — show assessment result */}
                {submitted && (
                  <div className="px-3 pb-2.5 border-t border-stone-100 pt-2">
                    <div className="ml-8 flex items-center gap-2">
                      {isCanDo ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Сможем сделать
                        </span>
                      ) : isCannotDo ? (
                        <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                          <XCircle className="h-3.5 w-3.5" />
                          Невозможно сделать
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">Не оценено</span>
                      )}
                      {data?.comment?.trim() && (
                        <span className="text-[11px] text-stone-500 italic truncate">
                          &laquo;{data.comment.trim()}&raquo;
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit button */}
          <div className="pt-2 space-y-2">
            {submitError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 rounded-md px-2 py-1.5">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {submitError}
              </div>
            )}

            {submitted ? (
              <div className="flex items-center justify-center gap-2 text-xs py-2.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 font-medium">
                <Check className="h-3.5 w-3.5" />
                Отчёт отправлен
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAssessed || submitting}
                className={`w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-md font-medium transition-all ${
                  allAssessed && !submitting
                    ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {submitting ? 'Отправка...' : 'Отправить отчёт'}
              </button>
            )}

            {!allAssessed && !submitted && (
              <p className="text-[10px] text-stone-400 text-center">
                Оцените все виджеты, чтобы отправить отчёт
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
