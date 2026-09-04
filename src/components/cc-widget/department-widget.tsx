'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Pie, PieChart, Cell, Label,
} from 'recharts';
import { Building2, Users, PhoneIncoming, Clock } from 'lucide-react';

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
  'hsl(220, 70%, 55%)',   // blue
  'hsl(160, 60%, 45%)',   // emerald
  'hsl(35, 85%, 55%)',    // amber
  'hsl(340, 65%, 55%)',   // rose
  'hsl(270, 50%, 55%)',   // violet
  'hsl(190, 60%, 45%)',   // cyan
  'hsl(15, 80%, 55%)',    // orange
  'hsl(55, 70%, 45%)',    // lime
];

const SLICE_COLORS_DARK = [
  'hsl(220, 70%, 65%)',
  'hsl(160, 60%, 55%)',
  'hsl(35, 85%, 65%)',
  'hsl(340, 65%, 65%)',
  'hsl(270, 50%, 65%)',
  'hsl(190, 60%, 55%)',
  'hsl(15, 80%, 65%)',
  'hsl(55, 70%, 55%)',
];

// ---- Department Indicators Widget ----
export function DepartmentWidget({ queues, agents }: DepartmentWidgetProps) {
  // Group queues by department (group field)
  const departments = queues.reduce<Record<string, Queue[]>>((acc, q) => {
    if (!acc[q.group]) acc[q.group] = [];
    acc[q.group].push(q);
    return acc;
  }, {});

  // Prepare pie data — by queue (for queue depth distribution)
  const inboundQueues = queues.filter(q => q.slaSeconds > 0);
  const queueDepthData = inboundQueues
    .filter(q => q.queueDepth > 0)
    .map(q => ({
      name: q.name,
      value: q.queueDepth,
      group: q.group,
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare pie data — by department (agents distribution)
  const deptAgentData = Object.entries(departments).map(([dept, dQueues]) => {
    const totalAgents = dQueues.reduce((s, q) => s + q.totalAgents, 0);
    const availAgents = dQueues.reduce((s, q) => s + q.availAgents, 0);
    const totalQueue = dQueues.reduce((s, q) => s + q.queueDepth, 0);
    return { name: dept, agents: totalAgents, available: availAgents, queueDepth: totalQueue };
  });

  // Prepare pie data — SLA status
  const slaOk = inboundQueues.filter(q => q.awtCurrent <= q.slaSeconds).length;
  const slaNear = inboundQueues.filter(q => q.awtCurrent > q.slaSeconds * 0.5 && q.awtCurrent <= q.slaSeconds).length;
  const slaViolated = inboundQueues.filter(q => q.awtCurrent > q.slaSeconds).length;

  const slaData = [
    { name: 'В норме', value: slaOk, status: 'ok' },
    { name: 'Приближается', value: slaNear, status: 'near' },
    { name: 'Нарушено', value: slaViolated, status: 'violated' },
  ].filter(d => d.value > 0);

  // Chart configs
  const queueDepthConfig: ChartConfig = {};
  queueDepthData.forEach((d, i) => {
    queueDepthConfig[d.name] = { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  const deptAgentConfig: ChartConfig = {};
  deptAgentData.forEach((d, i) => {
    deptAgentConfig[d.name] = { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  const slaConfig: ChartConfig = {
    'В норме': { label: 'В норме', color: 'hsl(160, 60%, 45%)' },
    'Приближается': { label: 'Приближается', color: 'hsl(35, 85%, 55%)' },
    'Нарушено': { label: 'Нарушено', color: 'hsl(0, 70%, 55%)' },
  };

  const fmt = (s: number) => {
    if (s === 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Compute total queue depth for center label
  const totalQueueDepth = queueDepthData.reduce((s, d) => s + d.value, 0);
  const totalAgentsAll = deptAgentData.reduce((s, d) => s + d.agents, 0);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Показатели отделов
        </h2>
      </div>

      {/* Row 1: Two main pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Queue Depth by Queue — Pie Chart */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PhoneIncoming className="h-4 w-4 text-blue-500" />
                Клиенты в очереди по отделам
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {totalQueueDepth} всего
              </Badge>
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
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy - 8} className="fill-foreground text-2xl font-bold">
                                  {totalQueueDepth}
                                </tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">
                                  в очереди
                                </tspan>
                              </text>
                            );
                          }
                          return null;
                        }}
                      />
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

        {/* Agent Distribution by Department — Pie Chart */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Агенты по направлениям
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {totalAgentsAll} всего
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-4">
              <ChartContainer config={deptAgentConfig} className="h-[180px] w-[180px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={deptAgentData}
                    dataKey="agents"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {deptAgentData.map((_, i) => (
                      <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy - 8} className="fill-foreground text-2xl font-bold">
                                {totalAgentsAll}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">
                                агентов
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-2 min-w-0">
                {deptAgentData.map((d, i) => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate flex-1">{d.name}</span>
                      <span className="text-xs font-semibold tabular-nums">{d.agents}</span>
                    </div>
                    <div className="flex gap-3 pl-[18px]">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                        {d.available} своб.
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        {d.queueDepth} в оч.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: SLA status pie + department detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* SLA Status Donut */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Статус SLA по очередям
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {inboundQueues.length} очередей
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-6">
              <ChartContainer config={slaConfig} className="h-[150px] w-[150px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={slaData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={38}
                    outerRadius={65}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {slaData.map((d) => (
                      <Cell
                        key={d.name}
                        fill={
                          d.status === 'ok' ? 'hsl(160, 60%, 45%)' :
                          d.status === 'near' ? 'hsl(35, 85%, 55%)' :
                          'hsl(0, 70%, 55%)'
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold">{slaOk}</p>
                    <p className="text-[11px] text-muted-foreground">В норме</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-semibold">{slaNear}</p>
                    <p className="text-[11px] text-muted-foreground">Приближается к лимиту</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-semibold">{slaViolated}</p>
                    <p className="text-[11px] text-muted-foreground">Нарушено</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-department mini cards with key metrics */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-500" />
              Сводка по направлениям
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {Object.entries(departments).map(([dept, dQueues]) => {
                const totalQueue = dQueues.reduce((s, q) => s + q.queueDepth, 0);
                const totalAgents = dQueues.reduce((s, q) => s + q.totalAgents, 0);
                const availAgents = dQueues.reduce((s, q) => s + q.availAgents, 0);
                const avgWait = dQueues.filter(q => q.slaSeconds > 0).length > 0
                  ? Math.round(dQueues.filter(q => q.slaSeconds > 0).reduce((s, q) => s + q.awtCurrent, 0) / dQueues.filter(q => q.slaSeconds > 0).length)
                  : 0;
                const violated = dQueues.filter(q => q.slaSeconds > 0 && q.awtCurrent > q.slaSeconds).length;
                const hasIssue = violated > 0 || totalQueue > 5;

                return (
                  <div key={dept} className={`p-3 rounded-lg border ${hasIssue ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{dept}</span>
                      <div className="flex items-center gap-1.5">
                        {violated > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {violated} SLA
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {dQueues.length} очередей
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-lg font-bold tabular-nums">{totalQueue}</p>
                        <p className="text-[10px] text-muted-foreground">в очереди</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold tabular-nums">{availAgents}/{totalAgents}</p>
                        <p className="text-[10px] text-muted-foreground">доступно</p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold tabular-nums ${avgWait > 60 ? 'text-red-600' : avgWait > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {fmt(avgWait)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">ср. ожидание</p>
                      </div>
                    </div>
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
