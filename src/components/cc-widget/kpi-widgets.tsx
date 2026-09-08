'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  PhoneIncoming, Headphones, AlertTriangle,
  PhoneCall, PhoneMissed, Clock, Timer, Users,
  TrendingUp, TrendingDown, Minus, Activity
} from 'lucide-react';
import { usePeriod, PeriodData, PERIOD_LABELS } from './period-context';

// ---- Types ----
interface Queue {
  id: string; name: string; group: string; slaSeconds: number;
  awtDay: number; awt10min: number; awtCurrent: number; queueDepth: number;
  availAgents: number; totalAgents: number; idlePercent: number;
}

interface Agent {
  id: string; name: string; login: string; extension: string; queue: string;
  status: 'online' | 'break' | 'offline'; callsToday: number;
  talkTime: number; waitTime: number; avgCallDuration: number; statusSince: string;
}

interface KpiWidgetProps {
  queues: Queue[];
  agents: Agent[];
}

// ---- MetricCard ----
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
  /** Show Live badge */
  isLive?: boolean;
}

function MetricCard({ label, value, unit, icon: Icon, color, bgColor, trend, trendValue, subtitle, isLive }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className={`group hover:shadow-md transition-shadow duration-200 ${isLive ? 'border-blue-200 dark:border-blue-800' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex items-center gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Сейчас
              </span>
            )}
            {trend && trendValue && !isLive && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {trendValue}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {value}
            {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Format helper ----
const fmt = (s: number) => {
  if (s === 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ---- Live Metrics Section (always "now") ----
function LiveMetricsSection({ pd }: { pd: PeriodData }) {
  const { currentOperatorsOnline, currentCallsInQueue } = pd.live;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-blue-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Оперативные
        </h2>
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* 2 Live metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Операторов на линии"
          value={currentOperatorsOnline}
          icon={Headphones}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          isLive
          subtitle="текущее количество"
        />
        <MetricCard
          label="Звонков в очереди"
          value={currentCallsInQueue}
          icon={PhoneIncoming}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          isLive
          trend={currentCallsInQueue > 15 ? 'up' : currentCallsInQueue === 0 ? 'down' : 'neutral'}
          trendValue={currentCallsInQueue > 15 ? 'высокая нагрузка' : currentCallsInQueue === 0 ? 'пусто' : undefined}
          subtitle="текущее количество"
        />
      </div>
    </div>
  );
}

// ---- Aggregated Metrics Section (by period) ----
function AggregatedMetricsSection({ pd }: { pd: PeriodData }) {
  const { aggregated } = pd;
  const periodLabel = PERIOD_LABELS[pd.period];

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-violet-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          За период
        </h2>
        <span className="text-[10px] text-muted-foreground/60">
          {periodLabel}
        </span>
      </div>

      {/* Row 1: 4 primary aggregated metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Принято звонков"
          value={aggregated.callsAnswered.toLocaleString('ru-RU')}
          icon={PhoneCall}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          trend="up"
          trendValue={`${pd.avgCallsPerDay}/день`}
          subtitle="колл-центром"
        />
        <MetricCard
          label="Ср. операторов на линии"
          value={aggregated.avgOperatorsOnline}
          icon={Users}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          subtitle="за период"
        />
        <MetricCard
          label="Повесили до ответа"
          value={aggregated.callsAbandoned.toLocaleString('ru-RU')}
          icon={PhoneMissed}
          color={pd.abandonedRate > 8 ? 'text-red-600 dark:text-red-400' : pd.abandonedRate > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={pd.abandonedRate > 8 ? 'bg-red-100 dark:bg-red-950/40' : pd.abandonedRate > 5 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          trend={pd.abandonedRate > 8 ? 'up' : 'down'}
          trendValue={`${pd.abandonedRate}%`}
          subtitle="не дождались ответа"
        />
        <MetricCard
          label="Превышено время ожидания"
          value={aggregated.waitTimeExceeded.toLocaleString('ru-RU')}
          icon={AlertTriangle}
          color={aggregated.waitTimeExceeded > 50 ? 'text-red-600 dark:text-red-400' : aggregated.waitTimeExceeded > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={aggregated.waitTimeExceeded > 50 ? 'bg-red-100 dark:bg-red-950/40' : aggregated.waitTimeExceeded > 20 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          trend={aggregated.waitTimeExceeded > 50 ? 'up' : 'down'}
          trendValue={aggregated.waitTimeExceeded > 50 ? 'критично' : aggregated.waitTimeExceeded > 20 ? 'внимание' : 'норма'}
          subtitle="в очереди"
        />
      </div>

      {/* Row 2: 2 secondary aggregated metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Ср. время разговора"
          value={fmt(aggregated.avgTalkTime)}
          icon={Timer}
          color="text-violet-600 dark:text-violet-400"
          bgColor="bg-violet-100 dark:bg-violet-950/40"
          subtitle="длительность обработки"
        />
        <MetricCard
          label="Ср. время ожидания"
          value={fmt(aggregated.avgWaitTime)}
          icon={Clock}
          color={aggregated.avgWaitTime > 60 ? 'text-red-600 dark:text-red-400' : aggregated.avgWaitTime > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={aggregated.avgWaitTime > 60 ? 'bg-red-100 dark:bg-red-950/40' : aggregated.avgWaitTime > 30 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          subtitle="до ответа оператора"
        />
      </div>
    </div>
  );
}

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents }: KpiWidgetProps) {
  const { periodData } = usePeriod();

  return (
    <div className="space-y-5">
      {/* Live metrics — ALWAYS shown, period-independent */}
      <LiveMetricsSection pd={periodData} />

      {/* Aggregated metrics — change with period */}
      <AggregatedMetricsSection pd={periodData} />
    </div>
  );
}
