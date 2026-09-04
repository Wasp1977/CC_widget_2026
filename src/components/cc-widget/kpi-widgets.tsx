'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  PhoneIncoming, Headphones, Pause, AlertTriangle,
  Users, Clock, UserCheck, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

// ---- Types ----
interface Queue {
  id: string;
  name: string;
  group: string;
  slaSeconds: number;
  awtDay: number;
  awt10min: number;
  awtCurrent: number;
  queueDepth: number;
  availAgents: number;
  totalAgents: number;
  idlePercent: number;
}

interface Agent {
  id: string;
  name: string;
  login: string;
  extension: string;
  queue: string;
  status: 'online' | 'break' | 'offline';
  callsToday: number;
  talkTime: number;
  waitTime: number;
  avgCallDuration: number;
  statusSince: string;
}

interface KpiWidgetProps {
  queues: Queue[];
  agents: Agent[];
}

// ---- Single KPI Widget ----
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
}

function MetricCard({ label, value, unit, icon: Icon, color, bgColor, trend, trendValue, subtitle }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {trendValue}
            </div>
          )}
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

// ---- Circular Progress Widget ----
interface CircularProgressProps {
  value: number;
  max: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackClass?: string;
}

function CircularProgress({ value, max, label, size = 80, strokeWidth = 6, colorClass = 'text-emerald-500', trackClass = 'text-muted-foreground/20' }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - percent);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          className={trackClass}
          stroke="currentColor"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents }: KpiWidgetProps) {
  const totalInQueue = queues.reduce((s, q) => s + q.queueDepth, 0);
  const totalOnline = agents.filter(a => a.status === 'online').length;
  const totalBreak = agents.filter(a => a.status === 'break').length;
  const totalOffline = agents.filter(a => a.status === 'offline').length;
  const totalAgents = agents.length;
  const criticalQueues = queues.filter(q => q.slaSeconds > 0 && q.awtCurrent > q.slaSeconds);
  const criticalCount = criticalQueues.length;
  const inboundQueues = queues.filter(q => q.slaSeconds > 0);
  const avgWaitCurrent = inboundQueues.length > 0
    ? Math.round(inboundQueues.reduce((s, q) => s + q.awtCurrent, 0) / inboundQueues.length)
    : 0;
  const totalAvail = queues.reduce((s, q) => s + q.availAgents, 0);
  const totalCapacity = queues.reduce((s, q) => s + q.totalAgents, 0);
  const slaComplianceRate = inboundQueues.length > 0
    ? Math.round((inboundQueues.filter(q => q.awtCurrent <= q.slaSeconds).length / inboundQueues.length) * 100)
    : 100;

  const fmt = (s: number) => {
    if (s === 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Числовые виджеты
        </h2>
      </div>

      {/* Primary KPI row — large numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Клиенты в очереди"
          value={totalInQueue}
          icon={PhoneIncoming}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          trend={totalInQueue > 10 ? 'up' : totalInQueue === 0 ? 'down' : 'neutral'}
          trendValue={totalInQueue > 10 ? 'высокая' : totalInQueue === 0 ? 'пусто' : 'норма'}
          subtitle={`в ${inboundQueues.length} очередях`}
        />
        <MetricCard
          label="Агенты на линии"
          value={totalOnline}
          unit={`/ ${totalAgents}`}
          icon={Headphones}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          trend={totalOnline >= totalAgents * 0.8 ? 'up' : 'down'}
          trendValue={`${Math.round((totalOnline / totalAgents) * 100)}%`}
          subtitle={`${totalBreak} на перерыве, ${totalOffline} отключены`}
        />
        <MetricCard
          label="Нарушения SLA"
          value={criticalCount}
          icon={AlertTriangle}
          color={criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={criticalCount > 0 ? 'bg-red-100 dark:bg-red-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          trend={criticalCount > 0 ? 'up' : 'down'}
          trendValue={criticalCount > 0 ? 'требует внимания' : 'все в норме'}
          subtitle={criticalCount > 0 ? `худшая: ${criticalQueues.sort((a, b) => (b.awtCurrent - b.slaSeconds) - (a.awtCurrent - a.slaSeconds))[0]?.name}` : 'SLA соблюдается'}
        />
        <MetricCard
          label="Ср. время ожидания"
          value={fmt(avgWaitCurrent)}
          icon={Clock}
          color={avgWaitCurrent > 60 ? 'text-red-600 dark:text-red-400' : avgWaitCurrent > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={avgWaitCurrent > 60 ? 'bg-red-100 dark:bg-red-950/40' : avgWaitCurrent > 30 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          subtitle="по всем входящим"
        />
      </div>

      {/* Secondary row — circular progress + smaller cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* SLA compliance ring */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-start">
              Соблюдение SLA
            </p>
            <div className="relative">
              <CircularProgress
                value={slaComplianceRate}
                max={100}
                label=""
                size={100}
                strokeWidth={8}
                colorClass={
                  slaComplianceRate >= 80 ? 'text-emerald-500' :
                  slaComplianceRate >= 50 ? 'text-amber-500' : 'text-red-500'
                }
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold tabular-nums">{slaComplianceRate}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              {inboundQueues.filter(q => q.awtCurrent <= q.slaSeconds).length} из {inboundQueues.length} очередей в норме
            </p>
          </CardContent>
        </Card>

        {/* Agent availability ring */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-start">
              Доступность агентов
            </p>
            <div className="flex items-center gap-4 mt-2">
              <CircularProgress
                value={totalAvail}
                max={totalCapacity}
                label="Свободны"
                size={70}
                strokeWidth={6}
                colorClass={totalAvail > 0 ? 'text-emerald-500' : 'text-red-500'}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">На линии: <strong className="text-foreground">{totalOnline}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">Перерыв: <strong className="text-foreground">{totalBreak}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
                  <span className="text-xs text-muted-foreground">Отключены: <strong className="text-foreground">{totalOffline}</strong></span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue depth breakdown mini */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Распределение очередей
            </p>
            <div className="space-y-2.5">
              {queues
                .filter(q => q.slaSeconds > 0)
                .sort((a, b) => b.queueDepth - a.queueDepth)
                .slice(0, 5)
                .map(q => {
                  const maxDepth = Math.max(...queues.filter(qq => qq.slaSeconds > 0).map(qq => qq.queueDepth), 1);
                  const pct = (q.queueDepth / maxDepth) * 100;
                  const barColor = q.queueDepth === 0 ? 'bg-emerald-500' : q.queueDepth <= 3 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div key={q.id} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-20 truncate">{q.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-5 text-right">{q.queueDepth}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
