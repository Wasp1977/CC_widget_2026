'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Feasibility, CJStep, StepsState } from './types';
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
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
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
    '═══ Описание виджетов: Отчёт ═══',
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
  lines.push('── Виджеты и оценка реализуемости ──');
  lines.push('');
  steps.forEach((s, i) => {
    const d = state[s.id];
    lines.push(`Виджет ${i + 1}: ${s.label}`);
    if (s.tag) lines.push(`  Тип: ${s.tag}`);
    if (s.periods?.length) lines.push(`  Периоды: ${s.periods.join(', ')}`);
    lines.push(`  Описание: ${s.description}`);
    lines.push(`  Оценка: ${d?.feasibility === 'can-do' ? 'Сможем сделать' : d?.feasibility === 'cannot-do' ? 'Невозможно сделать' : 'не оценено'}`);
    if (d?.comment?.trim()) {
      lines.push(`  Комментарий: ${d.comment.trim()}`);
    }
    if (s.devComment) {
      lines.push(`  Комментарий разработки: ${s.devComment}`);
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
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [state, setState] = useState<StepsState>(() => {
    const init: StepsState = {};
    steps.forEach((s) => {
      init[s.id] = {
        feasibility: s.defaultFeasibility ?? null,
        comment: '',
      };
    });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Notify parent
  useEffect(() => { onChange?.(state); }, [state, onChange]);

  // ── Computed ──
  const allRated = steps.every((s) => state[s.id]?.feasibility !== null);
  const ratedCount = steps.filter((s) => state[s.id]?.feasibility !== null).length;
  const canDoCount = steps.filter((s) => state[s.id]?.feasibility === 'can-do').length;
  const cannotDoCount = steps.filter((s) => state[s.id]?.feasibility === 'cannot-do').length;
  const isLastStep = activeStepIndex === steps.length - 1;
  const currentStep = steps[activeStepIndex];
  const currentData = currentStep ? state[currentStep.id] : null;

  // ── Actions ──
  const selectFeasibility = useCallback((stepId: string, f: Feasibility | null) => {
    setState((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], feasibility: prev[stepId]?.feasibility === f ? null : f },
    }));
  }, []);

  const setComment = useCallback((stepId: string, comment: string) => {
    setState((prev) => ({ ...prev, [stepId]: { ...prev[stepId], comment } }));
  }, []);

  // Manual advance via "Done" button
  const goToNext = useCallback(() => {
    if (!currentStep) return;
    if (state[currentStep.id]?.feasibility === null) return;
    if (isLastStep) return;
    setActiveStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [currentStep, state, isLastStep]);

  // Click on completed step — allow reviewing
  const handleStepClick = useCallback((idx: number) => {
    if (submitted) return;
    const step = steps[idx];
    if (state[step.id]?.feasibility !== null) {
      setActiveStepIndex(idx);
    }
  }, [steps, state, submitted]);

  const handleSubmit = useCallback(async () => {
    if (!allRated || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const report = buildReport(participantName, participantEmail, steps, state, scenarioName);
      const payload = {
        participantName: participantName.trim(),
        participantEmail: participantEmail.trim(),
        scenarioName,
        steps: steps.map((s) => ({ id: s.id, label: s.label, description: s.description })),
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
  }, [allRated, submitting, participantName, participantEmail, steps, state, scenarioName]);

  // ── Step classification ──
  const getStepStatus = (idx: number): 'completed' | 'active' | 'locked' => {
    if (idx === activeStepIndex) return 'active';
    if (state[steps[idx].id]?.feasibility !== null) return 'completed';
    return 'locked';
  };

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

      {/* ── Feasibility progress bar ── */}
      <div className="px-3 py-2 border-b border-stone-200 bg-stone-100/50">
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden flex">
            {canDoCount > 0 && (
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${(canDoCount / steps.length) * 100}%` }}
              />
            )}
            {cannotDoCount > 0 && (
              <div
                className="h-full bg-red-400 transition-all duration-500"
                style={{ width: `${(cannotDoCount / steps.length) * 100}%` }}
              />
            )}
          </div>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 className="h-3 w-3" />{canDoCount}
          </span>
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <XCircle className="h-3 w-3" />{cannotDoCount}
          </span>
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
          <div className="flex items-center gap-2 text-[10px] text-stone-400">
            <div className="flex-1 h-1 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${steps.length > 0 ? (ratedCount / steps.length) * 100 : 0}%` }}
              />
            </div>
            <span>{ratedCount}/{steps.length}</span>
          </div>

          {/* Steps list */}
          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            const data = state[step.id];
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const isLocked = status === 'locked';

            return (
              <div
                key={step.id}
                className={`rounded-md border overflow-hidden transition-opacity ${
                  isLocked
                    ? 'border-stone-200/60 bg-stone-100/50 opacity-50'
                    : isActive
                    ? 'border-amber-300 bg-white ring-1 ring-amber-200'
                    : data?.feasibility === 'can-do'
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : data?.feasibility === 'cannot-do'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                {/* Step header */}
                <button
                  onClick={() => handleStepClick(idx)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs transition-colors ${
                    isActive ? 'bg-amber-50/50' : ''
                  } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Number badge */}
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      data?.feasibility === 'can-do'
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                        : data?.feasibility === 'cannot-do'
                        ? 'bg-red-100 border-red-400 text-red-700'
                        : isActive
                        ? 'bg-amber-100 border-amber-400 text-amber-700'
                        : 'bg-stone-100 border-stone-300 text-stone-400'
                    }`}
                  >
                    {isCompleted ? (data?.feasibility === 'can-do' ? '✓' : '✗') : isLocked ? <Lock className="h-2.5 w-2.5" /> : idx + 1}
                  </span>

                  <span className={`flex-1 truncate ${
                    isActive ? 'font-semibold text-stone-800' :
                    isCompleted ? 'text-stone-500' :
                    'text-stone-400'
                  }`}>
                    {step.label}
                  </span>

                  {/* Tag badge */}
                  {step.tag && (
                    <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-500 font-medium">
                      {step.tag}
                    </span>
                  )}

                  {isActive && (
                    <ChevronDown className="shrink-0 h-3 w-3 text-amber-500 rotate-180" />
                  )}
                </button>

                {/* Detail panel — only for active step */}
                {isActive && !submitted && (
                  <div className="px-2.5 pb-2.5 pt-1 space-y-2 border-t border-stone-100">
                    {/* Step number label */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-amber-600">ВИДЖЕТ {idx + 1} ИЗ {steps.length}</span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Periods badge */}
                    {step.periods && step.periods.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-stone-400">Периоды:</span>
                        {step.periods.map(p => (
                          <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium border border-blue-200/50">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Dev team comment (read-only) */}
                    {step.devComment && (
                      <div className="p-2 rounded-md bg-violet-50 border border-violet-200/50">
                        <p className="text-[10px] text-violet-500 font-semibold mb-0.5">Комментарий разработки:</p>
                        <p className="text-[11px] text-violet-700 leading-relaxed">{step.devComment}</p>
                      </div>
                    )}

                    {/* Feasibility buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => selectFeasibility(step.id, 'can-do')}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-medium transition-all ${
                          data?.feasibility === 'can-do'
                            ? 'border-emerald-400 bg-emerald-100 text-emerald-700 shadow-sm scale-[1.02]'
                            : 'border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-stone-500'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Сможем сделать
                      </button>
                      <button
                        onClick={() => selectFeasibility(step.id, 'cannot-do')}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-medium transition-all ${
                          data?.feasibility === 'cannot-do'
                            ? 'border-red-400 bg-red-100 text-red-700 shadow-sm scale-[1.02]'
                            : 'border-stone-200 hover:border-red-300 hover:bg-red-50 text-stone-500'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Невозможно сделать
                      </button>
                    </div>

                    {/* Comment */}
                    <div className="relative">
                      <MessageSquare className="absolute left-2 top-2 h-3 w-3 text-stone-400" />
                      <textarea
                        value={data?.comment || ''}
                        onChange={(e) => setComment(step.id, e.target.value)}
                        placeholder="Ваш комментарий или вопрос..."
                        className="w-full text-xs pl-7 pr-2 p-2 rounded-md border border-stone-200 bg-stone-50 text-stone-700 placeholder:text-stone-400 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                        rows={2}
                      />
                    </div>

                    {/* Done button */}
                    <button
                      onClick={goToNext}
                      disabled={state[step.id]?.feasibility === null || isLastStep}
                      className={`w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-md font-medium transition-all ${
                        state[step.id]?.feasibility !== null && !isLastStep
                          ? 'bg-stone-700 text-white hover:bg-stone-800 active:scale-[0.98]'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {isLastStep ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      {isLastStep ? 'Последнее задание' : 'Готово'}
                    </button>
                  </div>
                )}

                {/* Completed step — show summary on click */}
                {isCompleted && activeStepIndex === idx && (
                  <div className="px-2.5 pb-2 pt-1 border-t border-stone-100 space-y-1.5">
                    <p className="text-[10px] text-stone-500 leading-relaxed">
                      {step.description}
                    </p>
                    {step.devComment && (
                      <p className="text-[10px] text-violet-600 italic">
                        Разработка: {step.devComment}
                      </p>
                    )}
                    {data?.comment?.trim() && (
                      <p className="text-[11px] text-stone-600 italic">
                        &ldquo;{data.comment.trim()}&rdquo;
                      </p>
                    )}
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
                disabled={!allRated || submitting}
                className={`w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-md font-medium transition-all ${
                  allRated && !submitting
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

            {!allRated && !submitted && (
              <p className="text-[10px] text-stone-400 text-center">
                {allRated
                  ? ''
                  : `Оцените все виджеты, чтобы отправить отчёт`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
