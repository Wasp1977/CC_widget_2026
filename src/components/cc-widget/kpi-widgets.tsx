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
  employeeQueue?: string;  // when set, data is scoped to this queue
}

// ---- Shared chart config ----
const opsChartConfig: ChartConfig = {
  value: { label: 'Операторов', color: 'hsl(160, 60%, 45%)' },
};

const queueChartConfig: ChartConfig = {
  value: { label: 'Звонков', color: 'hsl(220, 70%, 55%)' },
};

// ---- Bar Chart Card ----
function BarChartCard({
  label,
  data,
  chartConfig,
  icon: Icon,
  color,
  bgColor,
  periodLabel,
}: {
  label: string;
  data: BarDataPoint[];
  chartConfig: ChartConfig;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  periodLabel: string;
}) {
  const isDense = data.length > 15;

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {label} <span className="text-muted-foreground/50">· {periodLabel}</span>
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: isDense ? 9 : 10 }}
              interval={isDense ? 2 : 0}
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
              maxBarSize={isDense ? 12 : 28}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---- Main KPI Widgets Component ----
export function KpiWidgets({ queues, agents, employeeQueue }: KpiWidgetProps) {
  const { period, periodData } = usePeriod();
  const periodLabel = PERIOD_LABELS[period];

  // For employee: scale bar data to represent a single queue's share
  // In production this would come from the API filtered by queue
  const opsData = employeeQueue
    ? periodData.operatorsOnlineBars.map(d => ({ ...d, value: Math.round(d.value * 0.3) }))
    : periodData.operatorsOnlineBars;

  const queueData = employeeQueue
    ? periodData.callsInQueueBars.map(d => ({ ...d, value: Math.round(d.value * 0.2) }))
    : periodData.callsInQueueBars;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-blue-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Оперативные
        </h2>
      </div>

      {/* Metric cards — full width */}
      <div className="space-y-3">
        <BarChartCard
          label="Операторов на линии"
          data={opsData}
          chartConfig={opsChartConfig}
          icon={Headphones}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950/40"
          periodLabel={periodLabel}
        />
        <BarChartCard
          label="Звонков в очереди"
          data={queueData}
          chartConfig={queueChartConfig}
          icon={PhoneIncoming}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950/40"
          periodLabel={periodLabel}
        />
      </div>
    </div>
  );
}
