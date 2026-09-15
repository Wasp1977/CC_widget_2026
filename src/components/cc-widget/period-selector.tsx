'use client';

import { usePeriod, Period, PERIOD_LABELS, PERIOD_ORDER, isRealtimePeriod, isRetrospectivePeriod } from './period-context';
import { Clock, CalendarDays, Calendar, TrendingUp, Layers, Globe } from 'lucide-react';

const PERIOD_ICONS: Record<Period, React.ElementType> = {
  '1h': Clock,
  '1d': CalendarDays,
  '7d': Calendar,
  '30d': TrendingUp,
  'quarter': Layers,
  'year': Globe,
};

const PERIOD_DESCRIPTIONS: Record<Period, string> = {
  '1h': 'Оперативные данные за последний час',
  '1d': 'Сутки — разбивка по часам',
  '7d': 'Неделя — разбивка по дням',
  '30d': 'Месяц — разбивка по дням',
  'quarter': 'Квартал — разбивка по неделям',
  'year': 'Год — разбивка по месяцам',
};

export function PeriodSelector() {
  const { period, setPeriod } = usePeriod();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PERIOD_ORDER.map(p => {
          const Icon = PERIOD_ICONS[p];
          const active = period === p;
          const realtime = isRealtimePeriod(p);

          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 border
                ${active
                  ? realtime
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                    : 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-600/20'
                  : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {PERIOD_LABELS[p]}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        {PERIOD_DESCRIPTIONS[period]}
        {isRealtimePeriod(period) && (
          <span className="inline-flex items-center gap-1 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 dark:text-emerald-400">Live</span>
          </span>
        )}
        {isRetrospectivePeriod(period) && (
          <span className="text-violet-500 ml-1">Ретроспектива</span>
        )}
      </p>
    </div>
  );
}
