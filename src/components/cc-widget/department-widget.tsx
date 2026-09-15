'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Pie, PieChart, Cell,
  Bar, BarChart, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { PhoneIncoming, Clock } from 'lucide-react';
import { usePeriod, PERIOD_LABELS } from './period-context';

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

interface DepartmentWidgetProps {
  queues: Queue[];
  agents: Agent[];
}

// ---- Color palette for pie slices ----
const SLICE_COLORS = [
  'hsl(220, 70%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(35, 85%, 55%)',
  'hsl(340, 65%, 55%)',
  'hsl(270, 50%, 55%)',
  'hsl(190, 60%, 45%)',
];

// ---- Department Indicators Widget ----
export function DepartmentWidget({ queues, agents }: DepartmentWidgetProps) {
  const { periodData, period } = usePeriod();
  const periodLabel = PERIOD_LABELS[period];

  // Prepare pie data — from period context (period-dependent)
  const queueDepthData = periodData.queueDepthDistribution
    .map(d => ({
      name: d.name,
      value: d.depth,
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalQueueDepth = queueDepthData.reduce((s, d) => s + d.value, 0);

  // Chart configs for queue pie
  const queueDepthConfig: ChartConfig = {};
  queueDepthData.forEach((d, i) => {
    queueDepthConfig[d.name] = { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  // SLA bar chart data from period context
  const slaData = periodData.slaBarData.map(d => ({
    name: d.queue,
    compliance: d.compliance,
    avgWait: d.avgWait,
    slaTarget: d.slaTarget,
  }));

  const slaBarConfig: ChartConfig = {
    compliance: { label: 'SLA %', color: 'hsl(160, 60%, 45%)' },
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Показатели отделов
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Queue Depth by Queue — Pie Chart */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PhoneIncoming className="h-4 w-4 text-blue-500" />
                Клиенты в очереди по отделам
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {periodLabel}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {totalQueueDepth} всего
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {queueDepthData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ChartContainer config={queueDepthConfig} className="h-[180px] w-[180px] shrink-0">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={queueDepthData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {queueDepthData.map((_, i) => (
                        <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {queueDepthData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate flex-1">{d.name}</span>
                      <span className="text-xs font-semibold tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                <div className="text-center">
                  <PhoneIncoming className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p>Все очереди пусты</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA Status — Bar Chart */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                SLA (Соглашение об уровне обслуживания) по очередям
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {periodLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ChartContainer config={slaBarConfig} className="h-[200px] w-full">
              <BarChart data={slaData} layout="vertical" margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  width={80}
                />
                <Bar
                  dataKey="compliance"
                  fill="hsl(270, 50%, 55%)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ChartContainer>
            {/* Legend: compliance levels */}
            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span>≥80% норма</span>
              <span>50–79% обратите внимание</span>
              <span>&lt;50% неудовлетворительно</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
