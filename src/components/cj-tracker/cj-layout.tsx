'use client';

import { useState } from 'react';
import CJTracker from './cj-tracker';
import type { CJStep } from './types';
import { Sparkles, X } from 'lucide-react';

const CJ_STEPS: CJStep[] = [
  {
    id: 'w1',
    label: 'Селектор периода',
    tag: 'Навигация',
    periods: ['1h', 'today', '7d', '30d'],
    description: 'Переключатель горизонта статистики: 1 час, Сегодня, 7 дней, Месяц. При смене периода виджеты автоматически перестраиваются — оперативные заменяются ретроспективными и наоборот.',
  },
  {
    id: 'w2',
    label: 'KPI-карточки: Оперативные',
    tag: 'Числовые',
    periods: ['1h', 'today'],
    description: 'Четыре карточки с крупными числами: Клиенты в очереди, Агенты на линии, Нарушения SLA, Ср. время ожидания. Цветовая индикация: зелёный-норма, жёлтый-внимание, красный-критично. Иконки и трендовые метки.',
  },
  {
    id: 'w3',
    label: 'KPI-карточки: Ретроспектива',
    tag: 'Числовые',
    periods: ['7d', '30d'],
    description: 'Четыре карточки для исторической аналитики: Всего звонков, Ср. время ожидания, Покинули очередь, Ср. длительность. Показывают агрегированные данные за выбранный период.',
  },
  {
    id: 'w4',
    label: 'Кольцо SLA-комплаенс',
    tag: 'Кольцо',
    periods: ['1h', 'today', '7d', '30d'],
    description: 'Круговой индикатор (SVG) с процентом соблюдения SLA в центре. Для оперативных периодов показывает долю очередей в норме, для ретроспективы — долю звонков в рамках SLA за период.',
  },
  {
    id: 'w5',
    label: 'Кольцо доступности агентов',
    tag: 'Кольцо',
    periods: ['1h', 'today'],
    description: 'Круговой индикатор + легенда с количеством агентов на линии, на перерыве и отключённых. Показывает текущую укомплектованность смены в реальном времени.',
  },
  {
    id: 'w6',
    label: 'Распределение очередей',
    tag: 'Полосы',
    periods: ['1h', 'today'],
    description: 'Топ-5 входящих очередей по глубине в виде горизонтальных полос. Цвет полосы: зелёный — пусто, жёлтый — 1-3, красный — больше 3. Справа — числовое значение.',
  },
  {
    id: 'w7',
    label: 'Кольцо уровня обслуживания 80/20',
    tag: 'Кольцо',
    periods: ['7d', '30d'],
    description: 'Круговой индикатор Service Level — доля звонков, отвеченных за 20 секунд (стандарт 80/20). Доступен только в ретроспективных периодах.',
  },
  {
    id: 'w8',
    label: 'Звонки по направлениям',
    tag: 'Полосы',
    periods: ['7d', '30d'],
    description: 'Горизонтальные полосы с количеством звонков по каждому направлению. Заменяет «Распределение очередей» в ретроспективных периодах.',
  },
  {
    id: 'w9',
    label: 'Pie: Клиенты в очереди по отделам',
    tag: 'Круговая',
    periods: ['1h', 'today'],
    description: 'Кольцевая диаграмма (Recharts) распределения клиентов в очереди по отделам. В центре — общее число. Легенда справа с цветными точками и значениями.',
  },
  {
    id: 'w10',
    label: 'Pie: Агенты по направлениям',
    tag: 'Круговая',
    periods: ['1h', 'today'],
    description: 'Кольцевая диаграмма распределения агентов по направлениям (Входящие/Исходящие). В центре — общее число. Подлегенда: свободные агенты и глубина очереди.',
  },
  {
    id: 'w11',
    label: 'Donut: Статус SLA',
    tag: 'Круговая',
    periods: ['1h', 'today', '7d', '30d'],
    description: 'Три сектора: В норме (зелёный), Приближается (жёлтый), Нарушено (красный). Для оперативных периодов — по очередям, для ретро — по направлениям.',
  },
  {
    id: 'w12',
    label: 'Pie: Звонки по направлениям',
    tag: 'Круговая',
    periods: ['7d', '30d'],
    description: 'Кольцевая диаграмма доли звонков по каждому направлению. В центре — общее число. Подлегенда: SLA-комплаенс и покинувшие очередь.',
  },
  {
    id: 'w13',
    label: 'SLA по направлениям (бары)',
    tag: 'Полосы',
    periods: ['7d', '30d'],
    description: 'Progress-бары SLA-комплаенса для каждого направления. Цвет: зелёный ≥80%, жёлтый ≥60%, красный <60%. Подписи: ср. ожидание и час пик.',
  },
  {
    id: 'w14',
    label: 'Donut: Покинувшие очередь',
    tag: 'Круговая',
    periods: ['7d', '30d'],
    description: 'Кольцевая диаграмма покинувших очередь (abandoned calls) по направлениям. Бейдж с общим числом и процентом abandonment rate.',
  },
  {
    id: 'w15',
    label: 'Сводка по направлениям',
    tag: 'Карточки',
    periods: ['1h', 'today', '7d', '30d'],
    description: 'Карточки по каждому направлению с ключевыми метриками. Оперативные: очередь, доступно агентов, ср. ожидание. Ретро: звонков, ср. обработка, покинули. Красная подсветка при SLA-нарушении.',
  },
];

const SCENARIO =
  'Виджет Контакт-центра виртуальной АТС. Оценка реализуемости виджетов для продакшена.';

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
        <Sparkles className="h-3.5 w-3.5" />
        Виджеты
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
