'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  PhoneIncoming, Headphones,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { usePeriod, generatePeriodData, PeriodData } from './period-context';

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

function MetricCard({
  label, value, unit, icon: Icon, color, bgColor,
  trend, trendValue, subtitle, isLive,
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
      </CardContent>
    </Card>
  );
}

// ---- Live Metrics Section (always "now") ----
function LiveMetricsSection() {
  const { periodData } = usePeriod();
  const { currentOperatorsOnline, currentCallsInQueue } = periodData.live;

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

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents }: KpiWidgetProps) {
  return (
    <div className="space-y-5">
      {/* Live metrics — ALWAYS shown, period-independent */}
      <LiveMetricsSection />
    </div>
  );
}
