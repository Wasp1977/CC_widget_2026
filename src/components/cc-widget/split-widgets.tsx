'use client';

import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiWidgets } from './kpi-widgets';
import { DepartmentWidget } from './department-widget';
import { PeriodProvider, usePeriod, isRealtimePeriod, PERIOD_LABELS } from './period-context';
import { PeriodSelector } from './period-selector';
import {
  LayoutDashboard, PieChart, Layers, Activity
} from 'lucide-react';

// ---- Types (shared) ----
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
  { id: 'a1', name: 'Иванова Мария', login: 'ivanova', extension: '1001', queue: 'Продажи', status: 'online', callsToday: 47, talkTime: 11200, waitTime: 840, avgCallDuration: 238, statusSince: '2026-08-10T06:30:00Z' },
  { id: 'a2', name: 'Петров Алексей', login: 'petrov', extension: '1002', queue: 'Продажи', status: 'online', callsToday: 38, talkTime: 8500, waitTime: 620, avgCallDuration: 224, statusSince: '2026-08-10T06:45:00Z' },
  { id: 'a3', name: 'Сидорова Елена', login: 'sidorova', extension: '1003', queue: 'Поддержка', status: 'online', callsToday: 52, talkTime: 14500, waitTime: 1200, avgCallDuration: 279, statusSince: '2026-08-10T06:15:00Z' },
  { id: 'a4', name: 'Козлов Дмитрий', login: 'kozlov', extension: '1004', queue: 'Поддержка', status: 'break', callsToday: 41, talkTime: 10200, waitTime: 900, avgCallDuration: 249, statusSince: '2026-08-10T06:50:00Z' },
  { id: 'a5', name: 'Новикова Анна', login: 'novikova', extension: '1005', queue: 'Тех. отдел', status: 'online', callsToday: 29, talkTime: 9800, waitTime: 450, avgCallDuration: 338, statusSince: '2026-08-10T07:00:00Z' },
  { id: 'a6', name: 'Морозов Игорь', login: 'morozov', extension: '1006', queue: 'Тех. отдел', status: 'online', callsToday: 33, talkTime: 12000, waitTime: 500, avgCallDuration: 364, statusSince: '2026-08-10T06:20:00Z' },
  { id: 'a7', name: 'Волкова Ольга', login: 'volkova', extension: '1007', queue: 'Биллинг', status: 'online', callsToday: 44, talkTime: 7600, waitTime: 380, avgCallDuration: 173, statusSince: '2026-08-10T06:40:00Z' },
  { id: 'a8', name: 'Соколов Андрей', login: 'sokolov', extension: '1008', queue: 'Биллинг', status: 'offline', callsToday: 0, talkTime: 0, waitTime: 0, avgCallDuration: 0, statusSince: '2026-08-10T00:00:00Z' },
  { id: 'a9', name: 'Кузнецова Татьяна', login: 'kuznetsova', extension: '1009', queue: 'VIP-клиенты', status: 'online', callsToday: 18, talkTime: 5200, waitTime: 200, avgCallDuration: 289, statusSince: '2026-08-10T06:35:00Z' },
  { id: 'a10', name: 'Попов Максим', login: 'popov', extension: '1010', queue: 'VIP-клиенты', status: 'online', callsToday: 22, talkTime: 6100, waitTime: 280, avgCallDuration: 277, statusSince: '2026-08-10T06:25:00Z' },
  { id: 'a11', name: 'Лебедева Екатерина', login: 'lebedeva', extension: '1011', queue: 'Мультискилл', status: 'online', callsToday: 55, talkTime: 16000, waitTime: 1500, avgCallDuration: 291, statusSince: '2026-08-10T06:10:00Z' },
  { id: 'a12', name: 'Федоров Сергей', login: 'fedorov', extension: '1012', queue: 'Мультискилл', status: 'online', callsToday: 48, talkTime: 13800, waitTime: 1100, avgCallDuration: 288, statusSince: '2026-08-10T06:12:00Z' },
];

// ---- Simulation hook ----
function useRealtimeData() {
  const [queues, setQueues] = useState<Queue[]>(INITIAL_QUEUES);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const tickRef = useRef<ReturnType<typeof setInterval>>();

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
        if (a.status === 'online' && r < 0.05) newStatus = 'break';
        else if (a.status === 'break' && r < 0.08) newStatus = 'online';
        if (newStatus !== a.status) return { ...a, status: newStatus, statusSince: new Date().toISOString() };
        return a;
      }));
    }, 30000);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  return { queues, agents };
}

// ---- Inner component (needs period context) ----
function SplitWidgetsInner() {
  const { queues, agents } = useRealtimeData();
  const { period } = usePeriod();
  const realtime = isRealtimePeriod(period);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${realtime ? 'bg-primary' : 'bg-violet-600'} text-primary-foreground`}>
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">
                Виджет контакт-центра
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {realtime ? 'Панель супервизора' : 'Ретроспективная аналитика'}
                {' · '}
                Выберите колл-центр в каждом виджете
              </p>
            </div>
          </div>
          <Tabs defaultValue="all" className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs gap-1.5 px-3">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Все
              </TabsTrigger>
              <TabsTrigger value="numeric" className="text-xs gap-1.5 px-3">
                Числовые
              </TabsTrigger>
              <TabsTrigger value="dept" className="text-xs gap-1.5 px-3">
                <PieChart className="h-3.5 w-3.5" />
                Отделы
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Period selector */}
        <PeriodSelector />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* KPI Numeric Widgets */}
        <KpiWidgets queues={queues} agents={agents} />

        {/* Department Indicators */}
        <DepartmentWidget queues={queues} agents={agents} />
      </div>
    </div>
  );
}

// ---- Main Component (wraps with PeriodProvider) ----
export default function SplitWidgetsView() {
  return (
    <PeriodProvider>
      <SplitWidgetsInner />
    </PeriodProvider>
  );
}
