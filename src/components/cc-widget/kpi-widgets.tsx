'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  PhoneIncoming, Headphones, AlertTriangle,
  PhoneCall, PhoneMissed, Clock, Timer, Users,
  TrendingUp, TrendingDown, Minus, ChevronDown
} from 'lucide-react';
import {
  usePeriod, generatePeriodData, CALL_CENTERS,
  PeriodData, PERIOD_LABELS
} from './period-context';

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

// ---- Compact CC Dropdown ----
function CcDropdown({ ccId, onChange }: { ccId: string; onChange: (id: string) => void }) {
  return (
    <div className="relative">
      <select
        value={ccId}
        onChange={(e) => onChange(e.target.value)}
        className="text-[10px] font-medium pl-1.5 pr-4 py-0.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer appearance-none transition-colors"
      >
        {CALL_CENTERS.map(cc => (
          <option key={cc.id} value={cc.id}>{cc.name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ---- MetricCard (display, with CC selector inside) ----
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
  /** CC selector props */
  ccId: string;
  onCcChange: (id: string) => void;
}

function MetricCard({
  label, value, unit, icon: Icon, color, bgColor,
  trend, trendValue, subtitle, isLive,
  ccId, onCcChange
}: MetricCardProps) {
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
        {/* CC selector at the bottom of each card */}
        <div className="mt-3 pt-2 border-t border-border/50">
          <CcDropdown ccId={ccId} onChange={onCcChange} />
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

// ---- Smart card wrapper: manages its own CC state + data ----
function SmartLiveCard({
  metricKey,
  label,
  icon,
  color,
  bgColor,
  subtitle,
  defaultCcId = 'all',
}: {
  metricKey: 'currentOperatorsOnline' | 'currentCallsInQueue';
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle: string;
  defaultCcId?: string;
}) {
  const { period } = usePeriod();
  const [ccId, setCcId] = useState(defaultCcId);
  const pd = useMemo(() => generatePeriodData(period, ccId), [period, ccId]);

  const rawValue = pd.live[metricKey];

  return (
    <MetricCard
      label={label}
      value={rawValue}
      icon={icon}
      color={color}
      bgColor={bgColor}
      isLive
      subtitle={subtitle}
      ccId={ccId}
      onCcChange={setCcId}
      {...(metricKey === 'currentCallsInQueue' ? {
        trend: rawValue > 15 ? 'up' : rawValue === 0 ? 'down' : 'neutral',
        trendValue: rawValue > 15 ? 'высокая нагрузка' : rawValue === 0 ? 'пусто' : undefined,
      } : {})}
    />
  );
}

// ---- Smart aggregated card wrapper ----
type AggMetricKey = 'callsAnswered' | 'avgOperatorsOnline' | 'callsAbandoned' | 'waitTimeExceeded' | 'avgTalkTime' | 'avgWaitTime';

function SmartAggCard({
  metricKey,
  label,
  icon,
  color,
  bgColor,
  subtitle,
  defaultCcId = 'all',
  formatMode = 'number',
}: {
  metricKey: AggMetricKey;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle: string;
  defaultCcId?: string;
  formatMode?: 'number' | 'time' | 'decimal';
}) {
  const { period } = usePeriod();
  const [ccId, setCcId] = useState(defaultCcId);
  const pd = useMemo(() => generatePeriodData(period, ccId), [period, ccId]);
  const agg = pd.aggregated;

  const rawValue = agg[metricKey];

  // Format display value
  let displayValue: string | number;
  if (formatMode === 'time') {
    displayValue = fmt(rawValue);
  } else if (formatMode === 'decimal') {
    displayValue = rawValue;
  } else {
    displayValue = rawValue.toLocaleString('ru-RU');
  }

  // Compute per-metric trend/color overrides
  let trend: 'up' | 'down' | 'neutral' | undefined;
  let trendValue: string | undefined;
  let dynamicColor = color;
  let dynamicBgColor = bgColor;

  if (metricKey === 'callsAnswered') {
    trend = 'up';
    trendValue = `${pd.avgCallsPerDay}/день`;
  } else if (metricKey === 'callsAbandoned') {
    dynamicColor = pd.abandonedRate > 8 ? 'text-red-600 dark:text-red-400' : pd.abandonedRate > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
    dynamicBgColor = pd.abandonedRate > 8 ? 'bg-red-100 dark:bg-red-950/40' : pd.abandonedRate > 5 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40';
    trend = pd.abandonedRate > 8 ? 'up' : 'down';
    trendValue = `${pd.abandonedRate}%`;
  } else if (metricKey === 'waitTimeExceeded') {
    dynamicColor = rawValue > 50 ? 'text-red-600 dark:text-red-400' : rawValue > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
    dynamicBgColor = rawValue > 50 ? 'bg-red-100 dark:bg-red-950/40' : rawValue > 20 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40';
    trend = rawValue > 50 ? 'up' : 'down';
    trendValue = rawValue > 50 ? 'критично' : rawValue > 20 ? 'внимание' : 'норма';
  } else if (metricKey === 'avgWaitTime') {
    dynamicColor = rawValue > 60 ? 'text-red-600 dark:text-red-400' : rawValue > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
    dynamicBgColor = rawValue > 60 ? 'bg-red-100 dark:bg-red-950/40' : rawValue > 30 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40';
  }

  return (
    <MetricCard
      label={label}
      value={displayValue}
      icon={icon}
      color={dynamicColor}
      bgColor={dynamicBgColor}
      trend={trend}
      trendValue={trendValue}
      subtitle={subtitle}
      ccId={ccId}
      onCcChange={setCcId}
    />
  );
}

// ---- Live Metrics Section (always "now") ----
function LiveMetricsSection() {
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
        <SmartLiveCard
          metricKey="currentOperatorsOnline"
          label="Операторов на линии"
          icon={Headphones}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          subtitle="текущее количество"
        />
        <SmartLiveCard
          metricKey="currentCallsInQueue"
          label="Звонков в очереди"
          icon={PhoneIncoming}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          subtitle="текущее количество"
        />
      </div>
    </div>
  );
}

// ---- Aggregated Metrics Section (by period) ----
function AggregatedMetricsSection() {
  const { period } = usePeriod();
  const periodLabel = PERIOD_LABELS[period];

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
        <SmartAggCard
          metricKey="callsAnswered"
          label="Принято звонков"
          icon={PhoneCall}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          subtitle="колл-центром"
        />
        <SmartAggCard
          metricKey="avgOperatorsOnline"
          label="Ср. операторов на линии"
          icon={Users}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          subtitle="за период"
          formatMode="decimal"
        />
        <SmartAggCard
          metricKey="callsAbandoned"
          label="Повесили до ответа"
          icon={PhoneMissed}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          subtitle="не дождались ответа"
        />
        <SmartAggCard
          metricKey="waitTimeExceeded"
          label="Превышено время ожидания"
          icon={AlertTriangle}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          subtitle="в очереди"
        />
      </div>

      {/* Row 2: 2 secondary aggregated metrics */}
      <div className="grid grid-cols-2 gap-3">
        <SmartAggCard
          metricKey="avgTalkTime"
          label="Ср. время разговора"
          icon={Timer}
          color="text-violet-600 dark:text-violet-400"
          bgColor="bg-violet-100 dark:bg-violet-950/40"
          subtitle="длительность обработки"
          formatMode="time"
        />
        <SmartAggCard
          metricKey="avgWaitTime"
          label="Ср. время ожидания"
          icon={Clock}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          subtitle="до ответа оператора"
          formatMode="time"
        />
      </div>
    </div>
  );
}

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents }: KpiWidgetProps) {
  return (
    <div className="space-y-5">
      {/* Live metrics — ALWAYS shown, period-independent */}
      <LiveMetricsSection />

      {/* Aggregated metrics — change with period */}
      <AggregatedMetricsSection />
    </div>
  );
}
