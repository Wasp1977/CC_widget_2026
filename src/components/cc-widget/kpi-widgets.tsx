'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Headphones, PhoneIncoming } from 'lucide-react';
import { usePeriod, PERIOD_LABELS } from './period-context';
import type { BarDataPoint } from './period-context';

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

// ---- Shared chart config ----
const opsChartConfig: ChartConfig = {
  value: { label: 'Операторов', color: 'hsl(160, 60%, 45%)' },
};

const queueChartConfig: ChartConfig = {
  value: { label: 'Звонков', color: 'hsl(220, 70%, 55%)' },
};

// ---- Single Large Value (for period = 1h) ----
function SingleValueCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  isLive,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  isLive?: boolean;
  subtitle: string;
}) {
  return (
    <Card className={`group hover:shadow-md transition-shadow duration-200 ${isLive ? 'border-blue-200 dark:border-blue-800' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Сейчас
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-bold tracking-tight tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Bar Chart Card ----
function BarChartCard({
  label,
  data,
  chartConfig,
  icon: Icon,
  color,
  bgColor,
  periodLabel,
  avgValue,
}: {
  label: string;
  data: BarDataPoint[];
  chartConfig: ChartConfig;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  periodLabel: string;
  avgValue: number;
}) {
  const isHourly = data.length > 15; // compact ticks for many bars

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums">{avgValue.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">среднее</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-medium mb-2">
          {label} <span className="text-muted-foreground/50">· {periodLabel}</span>
        </p>
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: isHourly ? 9 : 10 }}
              interval={isHourly ? 2 : 0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[3, 3, 0, 0]}
              maxBarSize={isHourly ? 12 : 28}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents }: KpiWidgetProps) {
  const { period, periodData } = usePeriod();
  const periodLabel = PERIOD_LABELS[period];
  const isSingleValue = period === '1h';

  // Compute averages for bar charts
  const opsAvg = periodData.operatorsOnlineBars.length > 0
    ? periodData.operatorsOnlineBars.reduce((s, d) => s + d.value, 0) / periodData.operatorsOnlineBars.length
    : 0;

  const queueAvg = periodData.callsInQueueBars.length > 0
    ? periodData.callsInQueueBars.reduce((s, d) => s + d.value, 0) / periodData.callsInQueueBars.length
    : 0;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-blue-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Оперативные
        </h2>
        {isSingleValue && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {isSingleValue ? (
          <>
            <SingleValueCard
              label="Операторов на линии"
              value={periodData.live.currentOperatorsOnline}
              icon={Headphones}
              color="text-emerald-600 dark:text-emerald-400"
              bgColor="bg-emerald-100 dark:bg-emerald-950/40"
              isLive
              subtitle="текущее количество"
            />
            <SingleValueCard
              label="Звонков в очереди"
              value={periodData.live.currentCallsInQueue}
              icon={PhoneIncoming}
              color="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-100 dark:bg-blue-950/40"
              isLive
              subtitle="текущее количество"
            />
          </>
        ) : (
          <>
            <BarChartCard
              label="Операторов на линии"
              data={periodData.operatorsOnlineBars}
              chartConfig={opsChartConfig}
              icon={Headphones}
              color="text-emerald-600 dark:text-emerald-400"
              bgColor="bg-emerald-100 dark:bg-emerald-950/40"
              periodLabel={periodLabel}
              avgValue={opsAvg}
            />
            <BarChartCard
              label="Звонков в очереди"
              data={periodData.callsInQueueBars}
              chartConfig={queueChartConfig}
              icon={PhoneIncoming}
              color="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-100 dark:bg-blue-950/40"
              periodLabel={periodLabel}
              avgValue={queueAvg}
            />
          </>
        )}
      </div>
    </div>
  );
}
