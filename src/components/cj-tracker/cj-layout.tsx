'use client';

import { useState } from 'react';
import CJTracker from './cj-tracker';
import type { CJStep } from './types';
import { ClipboardList, X } from 'lucide-react';

const CJ_STEPS: CJStep[] = [
  { id: 's1', label: 'Оценка KPI-карточек' },
  { id: 's2', label: 'Чтение матрицы очередей' },
  { id: 's3', label: 'Анализ нарушения SLA' },
  { id: 's4', label: 'Просмотр сотрудников' },
  { id: 's5', label: 'Смена статуса сотрудника' },
  { id: 's6', label: 'Переключение на "Сотрудник"' },
  { id: 's7', label: 'Управление своим статусом' },
];

const SCENARIO =
  'Виджет Контакт-центра виртуальной АТС. Руководитель оценивает нагрузку очередей и управляет статусами сотрудников.';

interface CJLayoutProps {
  children: React.ReactNode;
}

export default function CJLayout({ children }: CJLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Prototype area 2/3 */}
      <div className="w-full md:w-2/3 h-full overflow-auto">
        {children}
      </div>

      {/* CJ Tracker 1/3 desktop */}
      <div className="hidden md:flex md:w-1/3 h-full shrink-0">
        <div className="w-full max-w-[380px]">
          <CJTracker steps={CJ_STEPS} scenarioName={SCENARIO} />
        </div>
      </div>

      {/* Mobile floating toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 shadow-lg text-xs font-medium text-stone-600"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <ClipboardList className="h-3.5 w-3.5" />
        CJ-трекер
      </button>

      {/* Mobile overlay panel */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-[85vw] max-w-[380px] h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-2 right-2 z-10 p-1 rounded bg-white/80 border border-stone-200 shadow-sm"
            >
              <X className="h-4 w-4 text-stone-500" />
            </button>
            <CJTracker steps={CJ_STEPS} scenarioName={SCENARIO} />
          </div>
        </div>
      )}
    </div>
  );
}
