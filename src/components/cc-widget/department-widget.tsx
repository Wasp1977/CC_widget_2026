'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Pie, PieChart, Cell, Label,
} from 'recharts';
import { Building2, Users, PhoneIncoming, Clock, PhoneCall, PhoneMissed, BarChart3 } from 'lucide-react';
import { usePeriod, isRealtimePeriod, PeriodData } from './period-context';

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

// ---- Color palette ----
const SLICE_COLORS = [
  'hsl(220, 70%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(35, 85%, 55%)',
  'hsl(340, 65%, 55%)',
  'hsl(270, 50%, 55%)',
  'hsl(190, 60%, 45%)',
  'hsl(15, 80%, 55%)',
  'hsl(55, 70%, 45%)',
];

const fmt = (s: number) => {
  if (s === 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ---- Real-time Department View ----
function RealtimeDepartmentView({ queues, agents }: { queues: Queue[]; agents: Agent[] }) {
  const departments = queues.reduce<Record<string, Queue[]>>((acc, q) => {
    if (!acc[q.group]) acc[q.group] = [];
    acc[q.group].push(q);
    return acc;
  }, {});

  const inboundQueues = queues.filter(q => q.slaSeconds > 0);
  const queueDepthData = inboundQueues
    .filter(q => q.queueDepth > 0)
    .map(q => ({ name: q.name, value: q.queueDepth, group: q.group }))
    .sort((a, b) => b.value - a.value);

  const deptAgentData = Object.entries(departments).map(([dept, dQueues]) => {
    const totalAgents = dQueues.reduce((s, q) => s + q.totalAgents, 0);
    const availAgents = dQueues.reduce((s, q) => s + q.availAgents, 0);
    const totalQueue = dQueues.reduce((s, q) => s + q.queueDepth, 0);
    return { name: dept, agents: totalAgents, available: availAgents, queueDepth: totalQueue };
  });

  const slaOk = inboundQueues.filter(q => q.awtCurrent <= q.slaSeconds).length;
  const slaNear = inboundQueues.filter(q => q.awtCurrent > q.slaSeconds * 0.5 && q.awtCurrent <= q.slaSeconds).length;
  const slaViolated = inboundQueues.filter(q => q.awtCurrent > q.slaSeconds).length;

  const slaData = [
    { name: 'В норме', value: slaOk, status: 'ok' },
    { name: 'Приближается', value: slaNear, status: 'near' },
    { name: 'Нарушено', value: slaViolated, status: 'violated' },
  ].filter(d => d.value > 0);

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

  const totalQueueDepth = queueDepthData.reduce((s, d) => s + d.value, 0);
  const totalAgentsAll = deptAgentData.reduce((s, d) => s + d.agents, 0);

  return (
    <>
      {/* Row 1: Queue depth + Agent distribution pies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Queue Depth Pie */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PhoneIncoming className="h-4 w-4 text-blue-500" />
                Клиенты в очереди по отделам
              </CardTitle>
              <Badge variant="outline" className="text-xs">{totalQueueDepth} всего</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {queueDepthData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ChartContainer config={queueDepthConfig} className="h-[180px] w-[180px] shrink-0">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={queueDepthData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} strokeWidth={2} stroke="hsl(var(--background))">
                      {queueDepthData.map((_, i) => (<Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />))}
                      <Label content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy - 8} className="fill-foreground text-2xl font-bold">{totalQueueDepth}</tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">в очереди</tspan>
                            </text>
                          );
                        }
                        return null;
                      }} />
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

        {/* Agent Distribution Pie */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Агенты по направлениям
              </CardTitle>
              <Badge variant="outline" className="text-xs">{totalAgentsAll} всего</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-4">
              <ChartContainer config={deptAgentConfig} className="h-[180px] w-[180px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={deptAgentData} dataKey="agents" nameKey="name" innerRadius={45} outerRadius={80} strokeWidth={2} stroke="hsl(var(--background))">
                    {deptAgentData.map((_, i) => (<Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />))}
                    <Label content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy - 8} className="fill-foreground text-2xl font-bold">{totalAgentsAll}</tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">агентов</tspan>
                          </text>
                        );
                      }
                      return null;
                    }} />
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
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{d.available} своб.</span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">{d.queueDepth} в оч.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: SLA pie + department summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* SLA Status Donut */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Статус SLA по очередям
              </CardTitle>
              <Badge variant="outline" className="text-xs">{inboundQueues.length} очередей</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-6">
              <ChartContainer config={slaConfig} className="h-[150px] w-[150px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={slaData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={65} strokeWidth={2} stroke="hsl(var(--background))">
                    {slaData.map((d) => (
                      <Cell key={d.name} fill={d.status === 'ok' ? 'hsl(160, 60%, 45%)' : d.status === 'near' ? 'hsl(35, 85%, 55%)' : 'hsl(0, 70%, 55%)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /><div><p className="text-sm font-semibold">{slaOk}</p><p className="text-[11px] text-muted-foreground">В норме</p></div></div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /><div><p className="text-sm font-semibold">{slaNear}</p><p className="text-[11px] text-muted-foreground">Приближается к лимиту</p></div></div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /><div><p className="text-sm font-semibold">{slaViolated}</p><p className="text-[11px] text-muted-foreground">Нарушено</p></div></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department summary cards (real-time) */}
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
                        {violated > 0 && (<Badge variant="destructive" className="text-[10px] px-1.5 py-0">{violated} SLA</Badge>)}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{dQueues.length} очередей</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><p className="text-lg font-bold tabular-nums">{totalQueue}</p><p className="text-[10px] text-muted-foreground">в очереди</p></div>
                      <div><p className="text-lg font-bold tabular-nums">{availAgents}/{totalAgents}</p><p className="text-[10px] text-muted-foreground">доступно</p></div>
                      <div><p className={`text-lg font-bold tabular-nums ${avgWait > 60 ? 'text-red-600' : avgWait > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(avgWait)}</p><p className="text-[10px] text-muted-foreground">ср. ожидание</p></div>
                    </div>
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

// ---- Retrospective Department View ----
function RetrospectiveDepartmentView({ pd }: { pd: PeriodData }) {
  // Calls by department pie
  const callsData = pd.departmentStats.map(d => ({ name: d.name, value: d.calls }));
  const callsConfig: ChartConfig = {};
  callsData.forEach((d, i) => {
    callsConfig[d.name] = { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });
  const totalCalls = callsData.reduce((s, d) => s + d.value, 0);

  // SLA by department pie
  const slaDeptData = pd.departmentStats.map(d => ({
    name: d.name,
    value: d.slaCompliance,
  }));
  const slaDeptConfig: ChartConfig = {};
  slaDeptData.forEach((d, i) => {
    slaDeptConfig[d.name] = { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });

  // Abandoned calls by department
  const abandonedData = pd.departmentStats
    .filter(d => d.abandoned > 0)
    .map(d => ({ name: d.name, value: d.abandoned }));
  const abandonedConfig: ChartConfig = {};
  abandonedData.forEach((d, i) => {
    abandonedConfig[d.name] = { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] };
  });
  const totalAbandoned = abandonedData.reduce((s, d) => s + d.value, 0);

  return (
    <>
      {/* Row 1: Calls by dept + SLA by dept */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Calls by department pie */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-blue-500" />
                Звонки по направлениям
              </CardTitle>
              <Badge variant="outline" className="text-xs">{totalCalls.toLocaleString('ru-RU')} всего</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-4">
              <ChartContainer config={callsConfig} className="h-[180px] w-[180px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={callsData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} strokeWidth={2} stroke="hsl(var(--background))">
                    {callsData.map((_, i) => (<Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />))}
                    <Label content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy - 8} className="fill-foreground text-2xl font-bold">{totalCalls > 999 ? `${(totalCalls / 1000).toFixed(1)}k` : totalCalls}</tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">звонков</tspan>
                          </text>
                        );
                      }
                      return null;
                    }} />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex-1 space-y-2 min-w-0">
                {pd.departmentStats.map((d, i) => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground truncate flex-1">{d.name}</span>
                      <span className="text-xs font-semibold tabular-nums">{d.calls.toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="flex gap-3 pl-[18px]">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400">{d.slaCompliance}% SLA</span>
                      <span className="text-[11px] text-red-600 dark:text-red-400">{d.abandoned} покинули</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA compliance by department */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                SLA по направлениям
              </CardTitle>
              <Badge variant="outline" className="text-xs">{pd.slaCompliancePercent}% общее</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-4">
              {pd.departmentStats.map((d, i) => {
                const barColor = d.slaCompliance >= 80 ? 'bg-emerald-500' : d.slaCompliance >= 60 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                        <span className="text-xs font-medium">{d.name}</span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${d.slaCompliance >= 80 ? 'text-emerald-600' : d.slaCompliance >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {d.slaCompliance}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${d.slaCompliance}%` }} />
                    </div>
                    <div className="flex gap-4 text-[11px] text-muted-foreground">
                      <span>Ср. ожидание: {fmt(d.avgWait)}</span>
                      <span>Пик: {d.peakHour}:00</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Abandoned + Department stats cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Abandoned calls pie */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PhoneMissed className="h-4 w-4 text-red-500" />
                Покинувшие очередь
              </CardTitle>
              <Badge variant="outline" className="text-xs">{totalAbandoned} всего ({pd.abandonedRate}%)</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {abandonedData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ChartContainer config={abandonedConfig} className="h-[150px] w-[150px] shrink-0">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={abandonedData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={65} strokeWidth={2} stroke="hsl(var(--background))">
                      {abandonedData.map((_, i) => (<Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="space-y-3">
                  {abandonedData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      <div>
                        <p className="text-sm font-semibold">{d.value}</p>
                        <p className="text-[11px] text-muted-foreground">{d.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[150px] text-sm text-muted-foreground">
                <PhoneMissed className="h-6 w-6 mr-2 text-emerald-500" />
                Нет покинувших очередь
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department detail cards (retrospective) */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-500" />
              Сводка по направлениям
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {pd.departmentStats.map(d => {
                const hasIssue = d.slaCompliance < 75 || d.abandoned > 50;
                return (
                  <div key={d.name} className={`p-3 rounded-lg border ${hasIssue ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{d.name}</span>
                      <div className="flex items-center gap-1.5">
                        {d.slaCompliance < 80 && (<Badge variant="destructive" className="text-[10px] px-1.5 py-0">{d.slaCompliance}% SLA</Badge>)}
                        {d.slaCompliance >= 80 && (<Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600">{d.slaCompliance}% SLA</Badge>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><p className="text-lg font-bold tabular-nums">{d.calls.toLocaleString('ru-RU')}</p><p className="text-[10px] text-muted-foreground">звонков</p></div>
                      <div><p className="text-lg font-bold tabular-nums">{fmt(d.avgHandleTime)}</p><p className="text-[10px] text-muted-foreground">ср. обработка</p></div>
                      <div><p className={`text-lg font-bold tabular-nums ${d.abandoned > 30 ? 'text-red-600' : 'text-amber-600'}`}>{d.abandoned}</p><p className="text-[10px] text-muted-foreground">покинули</p></div>
                    </div>
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

// ---- Main Department Widget ----
export function DepartmentWidget({ queues, agents }: DepartmentWidgetProps) {
  const { period, periodData } = usePeriod();
  const realtime = isRealtimePeriod(period);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className={`h-1 w-6 rounded-full ${realtime ? 'bg-blue-500' : 'bg-violet-500'}`} />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {realtime ? 'Показатели отделов' : 'Аналитика по направлениям'}
        </h2>
      </div>

      {realtime ? (
        <RealtimeDepartmentView queues={queues} agents={agents} />
      ) : (
        <RetrospectiveDepartmentView pd={periodData} />
      )}
    </div>
  );
}
