'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  PhoneIncoming, Headphones, AlertTriangle,
  Users, Clock, PhoneCall, PhoneMissed,
  TrendingUp, TrendingDown, Minus, BarChart3, Timer
} from 'lucide-react';
import { usePeriod, isRealtimePeriod, isRetrospectivePeriod, PeriodData } from './period-context';

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

// ---- CircularProgress ----
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className={trackClass} stroke="currentColor" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`${colorClass} transition-all duration-700 ease-out`} />
      </svg>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

// ---- Format helper ----
const fmt = (s: number) => {
  if (s === 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ---- Real-time KPI row (1h / today) ----
function RealtimeKpiRow({ queues, agents, pd }: { queues: Queue[]; agents: Agent[]; pd: PeriodData }) {
  const totalInQueue = pd.currentQueueDepth ?? queues.reduce((s, q) => s + q.queueDepth, 0);
  const totalOnline = pd.currentOnlineAgents ?? agents.filter(a => a.status === 'online').length;
  const totalBreak = pd.currentBreakAgents ?? agents.filter(a => a.status === 'break').length;
  const totalOffline = pd.currentOfflineAgents ?? agents.filter(a => a.status === 'offline').length;
  const totalAgents = agents.length;
  const criticalCount = pd.currentSlaViolations ?? 0;
  const avgWait = pd.currentAvgWait ?? 0;
  const slaRate = pd.slaComplianceRate ?? 100;
  const totalAvail = queues.reduce((s, q) => s + q.availAgents, 0);
  const totalCapacity = queues.reduce((s, q) => s + q.totalAgents, 0);
  const inboundCount = pd.totalInboundQueues ?? queues.filter(q => q.slaSeconds > 0).length;
  const inSlaCount = pd.queuesInSla ?? 0;

  return (
    <>
      {/* Primary KPI row — real-time large numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Клиенты в очереди"
          value={totalInQueue}
          icon={PhoneIncoming}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          trend={totalInQueue > 10 ? 'up' : totalInQueue === 0 ? 'down' : 'neutral'}
          trendValue={totalInQueue > 10 ? 'высокая' : totalInQueue === 0 ? 'пусто' : 'норма'}
          subtitle={`в ${inboundCount} очередях`}
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
          subtitle={criticalCount > 0 ? `${inboundCount - inSlaCount} из ${inboundCount} очередей` : 'SLA соблюдается'}
        />
        <MetricCard
          label="Ср. время ожидания"
          value={fmt(avgWait)}
          icon={Clock}
          color={avgWait > 60 ? 'text-red-600 dark:text-red-400' : avgWait > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={avgWait > 60 ? 'bg-red-100 dark:bg-red-950/40' : avgWait > 30 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          subtitle="по всем входящим"
        />
      </div>

      {/* Secondary row — real-time only cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* SLA compliance ring */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-start">
              Соблюдение SLA
            </p>
            <div className="relative">
              <CircularProgress value={slaRate} max={100} label="" size={100} strokeWidth={8} colorClass={slaRate >= 80 ? 'text-emerald-500' : slaRate >= 50 ? 'text-amber-500' : 'text-red-500'} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold tabular-nums">{slaRate}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              {inSlaCount} из {inboundCount} очередей в норме
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
              <CircularProgress value={totalAvail} max={totalCapacity} label="Свободны" size={70} strokeWidth={6} colorClass={totalAvail > 0 ? 'text-emerald-500' : 'text-red-500'} />
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

        {/* Queue depth breakdown */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Распределение очередей
            </p>
            <div className="space-y-2.5">
              {(pd.queueDepthDistribution ?? queues.filter(q => q.slaSeconds > 0).sort((a, b) => b.queueDepth - a.queueDepth).slice(0, 5).map(q => ({ name: q.name, depth: q.queueDepth })))
                .map((q, i, arr) => {
                  const maxDepth = Math.max(...arr.map(qq => qq.depth), 1);
                  const pct = (q.depth / maxDepth) * 100;
                  const barColor = q.depth === 0 ? 'bg-emerald-500' : q.depth <= 3 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div key={q.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-20 truncate">{q.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-5 text-right">{q.depth}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ---- Retrospective KPI row (7d / 30d) ----
function RetrospectiveKpiRow({ pd }: { pd: PeriodData }) {
  const slaPct = pd.slaCompliancePercent;
  const abandonRate = pd.abandonedRate;
  const serviceLevel = pd.serviceLevel;

  return (
    <>
      {/* Primary KPI row — historical metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Всего звонков"
          value={pd.totalCalls.toLocaleString('ru-RU')}
          icon={PhoneCall}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          trend="up"
          trendValue={`${pd.avgCallsPerDay}/день`}
          subtitle={`в среднем за период`}
        />
        <MetricCard
          label="Ср. время ожидания"
          value={fmt(pd.avgWaitTime)}
          icon={Clock}
          color={pd.avgWaitTime > 60 ? 'text-red-600 dark:text-red-400' : pd.avgWaitTime > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={pd.avgWaitTime > 60 ? 'bg-red-100 dark:bg-red-950/40' : pd.avgWaitTime > 30 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          subtitle="по всем входящим"
        />
        <MetricCard
          label="Покинули очередь"
          value={pd.abandonedCalls}
          icon={PhoneMissed}
          color={abandonRate > 8 ? 'text-red-600 dark:text-red-400' : abandonRate > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
          bgColor={abandonRate > 8 ? 'bg-red-100 dark:bg-red-950/40' : abandonRate > 5 ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}
          trend={abandonRate > 8 ? 'up' : 'down'}
          trendValue={`${abandonRate}%`}
          subtitle="не дождались ответа"
        />
        <MetricCard
          label="Ср. длительность"
          value={fmt(pd.avgHandleTime)}
          icon={Timer}
          color="text-violet-600 dark:text-violet-400"
          bgColor="bg-violet-100 dark:bg-violet-950/40"
          subtitle="время разговора"
        />
      </div>

      {/* Secondary row — retrospective cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* SLA compliance ring (historical) */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-start">
              SLA за период
            </p>
            <div className="relative">
              <CircularProgress value={slaPct} max={100} label="" size={100} strokeWidth={8} colorClass={slaPct >= 80 ? 'text-emerald-500' : slaPct >= 50 ? 'text-amber-500' : 'text-red-500'} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold tabular-nums">{slaPct}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              доля звонков в рамках SLA
            </p>
          </CardContent>
        </Card>

        {/* Service Level (80/20) */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-start">
              Уровень обслуживания
            </p>
            <div className="relative">
              <CircularProgress value={serviceLevel} max={100} label="" size={100} strokeWidth={8} colorClass={serviceLevel >= 80 ? 'text-emerald-500' : serviceLevel >= 60 ? 'text-amber-500' : 'text-red-500'} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold tabular-nums">{serviceLevel}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              отвечены за 20 сек (80/20)
            </p>
          </CardContent>
        </Card>

        {/* Department calls breakdown */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Звонки по направлениям
            </p>
            <div className="space-y-2.5">
              {pd.departmentStats
                .sort((a, b) => b.calls - a.calls)
                .map(d => {
                  const maxCalls = Math.max(...pd.departmentStats.map(ds => ds.calls), 1);
                  const pct = (d.calls / maxCalls) * 100;
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-24 truncate">{d.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-12 text-right">{d.calls.toLocaleString('ru-RU')}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents }: KpiWidgetProps) {
  const { period, periodData } = usePeriod();
  const realtime = isRealtimePeriod(period);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className={`h-1 w-6 rounded-full ${realtime ? 'bg-blue-500' : 'bg-violet-500'}`} />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {realtime ? 'Числовые виджеты' : 'Статистика за период'}
        </h2>
      </div>

      {realtime ? (
        <RealtimeKpiRow queues={queues} agents={agents} pd={periodData} />
      ) : (
        <RetrospectiveKpiRow pd={periodData} />
      )}
    </div>
  );
}
