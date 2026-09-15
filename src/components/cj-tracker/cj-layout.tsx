'use client';

import { useState } from 'react';
import CJTracker from './cj-tracker';
import type { CJStep } from './types';
import { ClipboardList, X } from 'lucide-react';

const CJ_STEPS: CJStep[] = [
  {
    id: 'w1',
    label: 'Селектор колл-центра',
    tag: 'Навигация',
    description: 'Выпадающий список для выбора колл-центра: «Все колл-центры» (агрегация), или конкретный (Продажи Пермь, Продажи Москва, Продажи Санкт-Петербург). При одном ЦК — скрывается. При нуле — экран-заглушка.',
    defaultFeasibility: 'cannot-do',
    devComment: 'не тянет отделы КЦ ОАТС в Конткт.ИИ, т.к. это отдельный продукт',
  },
  {
    id: 'w2',
    label: 'Селектор периода',
    tag: 'Навигация',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Переключатель горизонта статистики: Час, Сутки, Неделя, Месяц, Квартал, Год. Общий для всего дашборда. При Час — показывается текущее значение крупно. При остальных периодах — столбчатые диаграммы с разбивкой.',
    defaultFeasibility: 'cannot-do',
    devComment: 'холст общий и время применяется ко всем виджетам холста',
  },
  {
    id: 'w3',
    label: 'Текущее кол-во операторов на линии',
    tag: 'Оперативный',
    description: 'Столбчатая диаграмма. При периоде Час — одно крупное значение + пульс «Сейчас». Сутки — столбики по часам, Неделя — по дням, Месяц — по дням, Квартал — по неделям, Год — по месяцам. Значения — среднее по интервалу.',
    defaultFeasibility: 'can-do',
    devComment: 'тут нужно проговорить о нагрузке с сервисом КЦ. Могут быть проблемы как у Статистики',
  },
  {
    id: 'w4',
    label: 'Текущее кол-во звонков в очереди',
    tag: 'Оперативный',
    description: 'Столбчатая диаграмма. При периоде Час — одно крупное значение + пульс «Сейчас». Сутки — столбики по часам, Неделя — по дням, Месяц — по дням, Квартал — по неделям, Год — по месяцам. Значения — среднее по интервалу. Тренд: «высокая нагрузка» при >15, «пусто» при 0.',
    defaultFeasibility: 'can-do',
    devComment: 'комментарий аналогично выше',
  },
  {
    id: 'w5',
    label: 'Принято звонков колл-центром',
    tag: 'Агрегированный',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Карточка с крупным числом за выбранный период. Формат с разделителями разрядов (1 238). Тренд: среднее за день. Подпись: «колл-центром».',
    defaultFeasibility: 'cannot-do',
    devComment: 'не понимаю о чем речь',
  },
  {
    id: 'w6',
    label: 'Ср. кол-во операторов на линии',
    tag: 'Агрегированный',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Среднее количество операторов на линии за период. Десятичная дробь с 1 знаком (7.8). Подпись: «за период».',
    defaultFeasibility: 'cannot-do',
    devComment: 'период общий',
  },
  {
    id: 'w7',
    label: 'Повесили трубку до ответа оператора',
    tag: 'Агрегированный',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Количество abandonment-звонков за период. Цветовая индикация: красный при rate>8%, жёлтый >5%, зелёный ≤5%. Тренд: процент abandonment rate.',
    defaultFeasibility: 'cannot-do',
    devComment: 'цвет всегда фиолетовый',
  },
  {
    id: 'w8',
    label: 'Превышено время ожидания в очереди',
    tag: 'Агрегированный',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Количество звонков, превысивших SLA-порог ожидания. Цвет: красный при >50, жёлтый >20, зелёный ≤20. Тренд: «критично/внимание/норма».',
    defaultFeasibility: 'cannot-do',
    devComment: 'цвет всегда фиолетовый',
  },
  {
    id: 'w9',
    label: 'Ср. время разговора',
    tag: 'Агрегированный',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Средняя длительность обработки звонка (talk time) за период. Формат M:CC. Фиолетовая иконка таймера.',
    defaultFeasibility: 'cannot-do',
    devComment: 'период общий на холсте',
  },
  {
    id: 'w10',
    label: 'Ср. время ожидания',
    tag: 'Агрегированный',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Среднее время ожидания до ответа оператора за период. Формат M:CC. Цвет: красный >60с, жёлтый >30с, зелёный ≤30с.',
    defaultFeasibility: 'cannot-do',
    devComment: 'ответ выше',
  },
  {
    id: 'w11',
    label: 'Pie: Клиенты в очереди по отделам',
    tag: 'Круговая',
    periods: ['Час', 'Сутки'],
    description: 'Кольцевая диаграмма распределения клиентов в очереди по отделам. В центре — общее число. Легенда справа с цветными точками.',
    defaultFeasibility: 'can-do',
  },
  {
    id: 'w12',
    label: 'Pie: Агенты по направлениям',
    tag: 'Круговая',
    periods: ['Час', 'Сутки'],
    description: 'Кольцевая диаграмма распределения агентов по направлениям. В центре — общее число. Подлегенда: свободные и в очереди.',
    defaultFeasibility: 'cannot-do',
    devComment: 'не заложена подлегенда',
  },
  {
    id: 'w13',
    label: 'Donut: Статус SLA',
    tag: 'Круговая',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Горизонтальная столбчатая диаграмма SLA-комплаенс по очередям. Каждая очередь — строка с процентом выполнения. Цвет: зелёный ≥80%, жёлтый 50–79%, красный <50%.',
    defaultFeasibility: 'can-do',
  },
  {
    id: 'w14',
    label: 'Сводка по направлениям',
    tag: 'Карточки',
    periods: ['Час', 'Сутки', 'Неделя', 'Месяц', 'Квартал', 'Год'],
    description: 'Карточки по каждому направлению с ключевыми метриками. Оперативные: очередь, агенты, ср. ожидание. Ретро: звонков, обработка, покинули. Красная подсветка при SLA-нарушении.',
    defaultFeasibility: 'cannot-do',
    devComment: 'новый тип виджета, отсутствует, нужно корректные макеты и описание',
  },
];

const SCENARIO =
  'Виджет Контакт-центра. 8 метрик: 2 оперативных (Live) + 6 агрегированных (по периоду). Селектор колл-центра.';

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
