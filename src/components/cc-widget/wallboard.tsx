'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone, Users, Clock, AlertTriangle, ArrowUpDown, Headphones,
  PhoneIncoming, Pause, Power, UserCheck
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
  status: 'online' | 'break' | 'offline' | 'call';
  callsToday: number;
  talkTime: number;
  waitTime: number;
  avgCallDuration: number;
  statusSince: string;
}

// ---- Initial Data ----
const INITIAL_QUEUES: Queue[] = [
  { id: 'q1', name: 'Продажи', group: 'Входящие линии', slaSeconds: 30, awtDay: 45, awt10min: 62, awtCurrent: 28, queueDepth: 3, availAgents: 1, totalAgents: 5, idlePercent: 12 },
  { id: 'q2', name: 'Поддержка', group: 'Входящие линии', slaSeconds: 60, awtDay: 118, awt10min: 95, awtCurrent: 72, queueDepth: 7, availAgents: 0, totalAgents: 8, idlePercent: 5 },
  { id: 'q3', name: 'Тех. отдел', group: 'Входящие линии', slaSeconds: 90, awtDay: 32, awt10min: 15, awtCurrent: 0, queueDepth: 0, availAgents: 3, totalAgents: 4, idlePercent: 35 },
  { id: 'q4', name: 'Биллинг', group: 'Входящие линии', slaSeconds: 30, awtDay: 22, awt10min: 18, awtCurrent: 5, queueDepth: 1, availAgents: 2, totalAgents: 3, idlePercent: 28 },
  { id: 'q5', name: 'VIP-клиенты', group: 'Входящие линии', slaSeconds: 20, awtDay: 8, awt10min: 4, awtCurrent: 0, queueDepth: 0, availAgents: 2, totalAgents: 2, idlePercent: 40 },
  { id: 'q6', name: 'Мультискилл', group: 'Входящие линии', slaSeconds: 60, awtDay: 88, awt10min: 120, awtCurrent: 95, queueDepth: 12, availAgents: 0, totalAgents: 6, idlePercent: 2 },
  { id: 'q7', name: 'Обзвон B2B', group: 'Исходящие линии', slaSeconds: 0, awtDay: 0, awt10min: 0, awtCurrent: 0, queueDepth: 0, availAgents: 2, totalAgents: 4, idlePercent: 50 },
  { id: 'q8', name: 'Опросы', group: 'Исходящие линии', slaSeconds: 0, awtDay: 0, awt10min: 0, awtCurrent: 0, queueDepth: 0, availAgents: 1, totalAgents: 2, idlePercent: 50 },
];

const INITIAL_AGENTS: Agent[] = [
  { id: 'a1', name: 'Иванова Мария', login: 'ivanova', extension: '1001', queue: 'Продажи', status: 'call', callsToday: 47, talkTime: 11200, waitTime: 840, avgCallDuration: 238, statusSince: '2026-08-10T06:30:00Z' },
  { id: 'a2', name: 'Петров Алексей', login: 'petrov', extension: '1002', queue: 'Продажи', status: 'online', callsToday: 38, talkTime: 8500, waitTime: 620, avgCallDuration: 224, statusSince: '2026-08-10T06:45:00Z' },
  { id: 'a3', name: 'Сидорова Елена', login: 'sidorova', extension: '1003', queue: 'Поддержка', status: 'call', callsToday: 52, talkTime: 14500, waitTime: 1200, avgCallDuration: 279, statusSince: '2026-08-10T06:15:00Z' },
  { id: 'a4', name: 'Козлов Дмитрий', login: 'kozlov', extension: '1004', queue: 'Поддержка', status: 'break', callsToday: 41, talkTime: 10200, waitTime: 900, avgCallDuration: 249, statusSince: '2026-08-10T06:50:00Z' },
  { id: 'a5', name: 'Новикова Анна', login: 'novikova', extension: '1005', queue: 'Тех. отдел', status: 'online', callsToday: 29, talkTime: 9800, waitTime: 450, avgCallDuration: 338, statusSince: '2026-08-10T07:00:00Z' },
  { id: 'a6', name: 'Морозов Игорь', login: 'morozov', extension: '1006', queue: 'Тех. отдел', status: 'call', callsToday: 33, talkTime: 12000, waitTime: 500, avgCallDuration: 364, statusSince: '2026-08-10T06:20:00Z' },
  { id: 'a7', name: 'Волкова Ольга', login: 'volkova', extension: '1007', queue: 'Биллинг', status: 'online', callsToday: 44, talkTime: 7600, waitTime: 380, avgCallDuration: 173, statusSince: '2026-08-10T06:40:00Z' },
  { id: 'a8', name: 'Соколов Андрей', login: 'sokolov', extension: '1008', queue: 'Биллинг', status: 'offline', callsToday: 0, talkTime: 0, waitTime: 0, avgCallDuration: 0, statusSince: '2026-08-10T00:00:00Z' },
  { id: 'a9', name: 'Кузнецова Татьяна', login: 'kuznetsova', extension: '1009', queue: 'VIP-клиенты', status: 'online', callsToday: 18, talkTime: 5200, waitTime: 200, avgCallDuration: 289, statusSince: '2026-08-10T06:35:00Z' },
  { id: 'a10', name: 'Попов Максим', login: 'popov', extension: '1010', queue: 'VIP-клиенты', status: 'call', callsToday: 22, talkTime: 6100, waitTime: 280, avgCallDuration: 277, statusSince: '2026-08-10T06:25:00Z' },
  { id: 'a11', name: 'Лебедева Екатерина', login: 'lebedeva', extension: '1011', queue: 'Мультискилл', status: 'call', callsToday: 55, talkTime: 16000, waitTime: 1500, avgCallDuration: 291, statusSince: '2026-08-10T06:10:00Z' },
  { id: 'a12', name: 'Федоров Сергей', login: 'fedorov', extension: '1012', queue: 'Мультискилл', status: 'call', callsToday: 48, talkTime: 13800, waitTime: 1100, avgCallDuration: 288, statusSince: '2026-08-10T06:12:00Z' },
];

// ---- Helpers ----
function getAwtColor(value: number, sla: number): string {
  if (sla === 0) return 'text-zinc-400';
  if (value === 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value <= sla * 0.5) return 'text-emerald-600 dark:text-emerald-400';
  if (value <= sla) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getAwtBg(value: number, sla: number): string {
  if (sla === 0) return '';
  if (value === 0) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (value <= sla * 0.5) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (value <= sla) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-red-50 dark:bg-red-950/30';
}

function getQueueDepthColor(value: number): string {
  if (value === 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value <= 3) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getQueueDepthBg(value: number): string {
  if (value === 0) return 'bg-emerald-50 dark:bg-emerald-950/30';
  if (value <= 3) return 'bg-amber-50 dark:bg-amber-950/30';
  return 'bg-red-50 dark:bg-red-950/30';
}

function getAvailColor(value: number, total: number): string {
  if (total === 0) return 'text-zinc-400';
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-red-600 dark:text-red-400';
}

function fmt(s: number): string {
  if (s === 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getStatusDot(status: Agent['status']): string {
  const map: Record<Agent['status'], string> = {
    online: 'bg-emerald-500', call: 'bg-blue-500', break: 'bg-amber-500', offline: 'bg-zinc-400',
  };
  return map[status];
}

function getStatusLabel(status: Agent['status']): string {
  const map: Record<Agent['status'], string> = { online: 'На линии', call: 'Разговор', break: 'Перерыв', offline: 'Отключён' };
  return map[status];
}

function getStatusBadge(status: Agent['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<Agent['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = { online: 'default', call: 'secondary', break: 'outline', offline: 'destructive' };
  return map[status];
}

// ---- Simulation hook ----
function useRealtimeData() {
  const [queues, setQueues] = useState<Queue[]>(INITIAL_QUEUES);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_QUEUES.length > 0 ? INITIAL_AGENTS : []);
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  const changeAgentStatus = useCallback((agentId: string, newStatus: Agent['status']) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, status: newStatus, statusSince: new Date().toISOString() } : a
    ));
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setQueues(prev => prev.map(q => {
        if (q.slaSeconds === 0) return q;
        return {
          ...q,
          awtCurrent: Math.max(0, q.awtCurrent + Math.round((Math.random() - 0.5) * 16)),
          awt10min: Math.max(0, q.awt10min + Math.round((Math.random() - 0.5) * 10)),
          awtDay: Math.max(0, q.awtDay + Math.round((Math.random() - 0.5) * 4)),
          queueDepth: Math.max(0, q.queueDepth + Math.round((Math.random() - 0.5) * 3)),
          availAgents: Math.max(0, Math.min(q.totalAgents, q.availAgents + (Math.random() < 0.05 ? (Math.random() < 0.5 ? 1 : -1) : 0))),
        };
      }));

      setAgents(prev => prev.map(a => {
        if (a.status === 'offline') return a;
        let newStatus = a.status;
        const r = Math.random();
        if (a.status === 'call' && r < 0.04) {
          newStatus = 'online';
          return { ...a, status: newStatus, callsToday: a.callsToday + 1, talkTime: a.talkTime + Math.round(Math.random() * 300 + 60) };
        }
        if (a.status === 'online' && r < 0.03) newStatus = 'call';
        else if (a.status === 'online' && r < 0.05) newStatus = 'break';
        else if (a.status === 'break' && r < 0.06) newStatus = 'online';
        if (newStatus !== a.status) return { ...a, status: newStatus, statusSince: new Date().toISOString() };
        return a;
      }));
    }, 2000);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  return { queues, agents, changeAgentStatus };
}

// ---- Summary Cards ----
function SummaryCards({ queues, agents }: { queues: Queue[]; agents: Agent[] }) {
  const totalInQueue = queues.reduce((s, q) => s + q.queueDepth, 0);
  const totalOnline = agents.filter(a => a.status === 'online' || a.status === 'call').length;
  const totalBreak = agents.filter(a => a.status === 'break').length;
  const criticalQueues = queues.filter(q => q.slaSeconds > 0 && q.awtCurrent > q.slaSeconds).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50">
            <PhoneIncoming className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">В очереди</p>
            <p className="text-2xl font-bold">{totalInQueue}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
            <Headphones className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">На линии</p>
            <p className="text-2xl font-bold">{totalOnline}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50">
            <Pause className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">На перерыве</p>
            <p className="text-2xl font-bold">{totalBreak}</p>
          </div>
        </CardContent>
      </Card>
      <Card className={`border-l-4 ${criticalQueues > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
        <CardContent className="p-3 flex items-center gap-3">
          <div className={`p-2 rounded-lg ${criticalQueues > 0 ? 'bg-red-100 dark:bg-red-950/50' : 'bg-emerald-100 dark:bg-emerald-950/50'}`}>
            <AlertTriangle className={`h-5 w-5 ${criticalQueues > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">SLA нарушен</p>
            <p className="text-2xl font-bold">{criticalQueues}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Wallboard Matrix ----
function WallboardMatrix({ queues }: { queues: Queue[] }) {
  const groups = queues.reduce<Record<string, Queue[]>>((acc, q) => {
    if (!acc[q.group]) acc[q.group] = [];
    acc[q.group].push(q);
    return acc;
  }, {});

  const rows = [
    { key: 'awtDay', label: 'Ср. ожид. (день)', icon: Clock, render: (q: Queue) => ({ text: fmt(q.awtDay), color: getAwtColor(q.awtDay, q.slaSeconds), bg: getAwtBg(q.awtDay, q.slaSeconds) }) },
    { key: 'awt10min', label: '10 минут', icon: Clock, render: (q: Queue) => ({ text: fmt(q.awt10min), color: getAwtColor(q.awt10min, q.slaSeconds), bg: getAwtBg(q.awt10min, q.slaSeconds) }) },
    { key: 'awtCurrent', label: 'Текущее', icon: Clock, render: (q: Queue) => ({ text: fmt(q.awtCurrent), color: getAwtColor(q.awtCurrent, q.slaSeconds), bg: getAwtBg(q.awtCurrent, q.slaSeconds) }) },
    { key: 'queueDepth', label: 'Очередь', icon: Users, render: (q: Queue) => ({ text: String(q.queueDepth), color: getQueueDepthColor(q.queueDepth), bg: getQueueDepthBg(q.queueDepth) }) },
    { key: 'avail', label: 'Свободно', icon: UserCheck, render: (q: Queue) => ({ text: `${q.availAgents}/${q.totalAgents}`, color: getAvailColor(q.availAgents, q.totalAgents), bg: '' }) },
    { key: 'idle', label: 'Простой', icon: Pause, render: (q: Queue) => ({ text: `${q.idlePercent}%`, color: q.idlePercent > 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400', bg: '' }) },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Мониторинг очередей
          </CardTitle>
          <Badge variant="outline" className="text-xs gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium p-2 pl-4 min-w-[120px] sticky left-0 bg-card z-10 border-b">Метрика</th>
                {Object.entries(groups).map(([group, gQueues]) => (
                  <th key={group} colSpan={gQueues.length} className="text-center text-xs font-semibold p-2 bg-slate-100 dark:bg-slate-800/80 min-w-[80px] border-b border-l">
                    {group}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="p-1 pl-4 sticky left-0 bg-card z-10 border-b"></th>
                {queues.map(q => (
                  <th key={q.id} className="text-center text-xs font-medium p-1.5 text-muted-foreground min-w-[80px] border-b border-l">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default hover:underline">{q.name}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>SLA: {q.slaSeconds > 0 ? `${q.slaSeconds} сек` : '—'}</p>
                          <p>Агенты: {q.totalAgents}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {q.slaSeconds > 0 && (
                      <span className="block text-[10px] text-muted-foreground/70">SLA {q.slaSeconds}с</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-2 pl-4 text-xs font-medium text-muted-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <row.icon className="h-3 w-3 shrink-0" />
                      {row.label}
                    </span>
                  </td>
                  {queues.map(q => {
                    const val = row.render(q);
                    return (
                      <td key={`${q.id}-${row.key}`} className={`text-center p-2 font-mono font-bold text-sm transition-colors duration-300 border-l border-border/30 ${val.bg} ${val.color}`}>
                        {val.text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Agents Panel ----
function AgentsPanel({ agents, onChangeStatus }: { agents: Agent[]; onChangeStatus: (id: string, status: Agent['status']) => void }) {
  const statusOrder: Agent['status'][] = ['call', 'online', 'break', 'offline'];
  const sorted = [...agents].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
  const totalCalls = agents.reduce((s, a) => s + a.callsToday, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Агенты
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Всего: {agents.length}</span>
            <span className="text-border">·</span>
            <span>Звонков: {totalCalls}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[460px] overflow-y-auto">
          {sorted.map(agent => (
            <div
              key={agent.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStatusDot(agent.status)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <p className="text-xs text-muted-foreground">{agent.queue} · Внутр. {agent.extension}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getStatusBadge(agent.status)} className="text-[11px]">
                  {getStatusLabel(agent.status)}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                  {agent.callsToday}зв
                </span>
                <select
                  className="text-xs bg-transparent border border-border rounded px-1.5 py-0.5 text-muted-foreground cursor-pointer hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
                  value={agent.status}
                  onChange={(e) => onChangeStatus(agent.id, e.target.value as Agent['status'])}
                >
                  <option value="online">На линии</option>
                  <option value="call">Разговор</option>
                  <option value="break">Перерыв</option>
                  <option value="offline">Отключён</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Employee Dashboard ----
function EmployeeDashboard({ agents, onChangeStatus }: { agents: Agent[]; onChangeStatus: (id: string, status: Agent['status']) => void }) {
  const me = agents[0] || { id: 'a1', name: 'Иванова Мария', login: 'ivanova', extension: '1001', queue: 'Продажи', status: 'online' as const, callsToday: 0, talkTime: 0, waitTime: 0, avgCallDuration: 0, statusSince: new Date().toISOString() };

  const statusTime = me.statusSince ? Math.floor((Date.now() - new Date(me.statusSince).getTime()) / 1000) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Мой статус</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold shrink-0">
              {me.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-semibold text-lg">{me.name}</p>
              <p className="text-sm text-muted-foreground">{me.queue} · Внутр. {me.extension}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStatusDot(me.status)} ${me.status === 'call' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">{getStatusLabel(me.status)}</span>
            {statusTime > 0 && (
              <span className="text-xs text-muted-foreground ml-1">({fmt(statusTime)})</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              { status: 'online' as const, label: 'На линии', icon: Phone, activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400', hoverClass: 'hover:border-emerald-300 hover:bg-emerald-50/50' },
              { status: 'break' as const, label: 'Перерыв', icon: Pause, activeClass: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400', hoverClass: 'hover:border-amber-300 hover:bg-amber-50/50' },
            ] as const).map(btn => (
              <button
                key={btn.status}
                onClick={() => onChangeStatus(me.id, btn.status)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  me.status === btn.status ? btn.activeClass : `border-border ${btn.hoverClass}`
                }`}
              >
                <btn.icon className="h-4 w-4" />
                {btn.label}
              </button>
            ))}
            <button
              onClick={() => onChangeStatus(me.id, 'offline')}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium col-span-2 ${
                me.status === 'offline'
                  ? 'border-zinc-500 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  : 'border-border hover:border-zinc-400 hover:bg-zinc-50'
              }`}
            >
              <Power className="h-4 w-4" />
              Отключиться
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Моя статистика сегодня</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Принято звонков', value: me.callsToday, bgClass: 'bg-blue-50 dark:bg-blue-950/30', textClass: 'text-blue-600 dark:text-blue-400' },
              { label: 'Время разговора', value: fmt(me.talkTime), bgClass: 'bg-emerald-50 dark:bg-emerald-950/30', textClass: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Время ожидания', value: fmt(me.waitTime), bgClass: 'bg-amber-50 dark:bg-amber-950/30', textClass: 'text-amber-600 dark:text-amber-400' },
              { label: 'Ср. длительность', value: fmt(me.avgCallDuration), bgClass: 'bg-violet-50 dark:bg-violet-950/30', textClass: 'text-violet-600 dark:text-violet-400' },
            ].map(stat => (
              <div key={stat.label} className={`p-3 rounded-lg ${stat.bgClass}`}>
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textClass}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Моя очередь: {me.queue}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agents
              .filter(a => a.queue === me.queue && a.id !== me.id)
              .map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusDot(a.status)}`} />
                    <span className="text-sm">{a.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadge(a.status)} className="text-[10px] px-1.5 py-0">
                      {getStatusLabel(a.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{a.callsToday}зв</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Widget ----
export default function ContactCenterWidget() {
  const { queues, agents, changeAgentStatus } = useRealtimeData();
  const [role, setRole] = useState<'supervisor' | 'agent'>('supervisor');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-border sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 dark:bg-slate-100">
              <Headphones className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Контакт-центр</h1>
              <p className="text-xs text-muted-foreground">Виртуальная АТС · Мониторинг</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Онлайн
            </div>
            <Tabs value={role} onValueChange={(v) => setRole(v as 'supervisor' | 'agent')}>
              <TabsList className="h-8">
                <TabsTrigger value="supervisor" className="text-xs px-3 h-7 gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Руководитель
                </TabsTrigger>
                <TabsTrigger value="agent" className="text-xs px-3 h-7 gap-1.5">
                  <Headphones className="h-3.5 w-3.5" />
                  Сотрудник
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto p-4">
        {role === 'supervisor' ? (
          <>
            <SummaryCards queues={queues} agents={agents} />
            <WallboardMatrix queues={queues} />
            <div className="mt-4">
              <AgentsPanel agents={agents} onChangeStatus={changeAgentStatus} />
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <EmployeeDashboard agents={agents} onChangeStatus={changeAgentStatus} />
          </div>
        )}
      </main>
    </div>
  );
}