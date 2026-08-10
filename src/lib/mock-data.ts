// Mock data for Contact Center Widget prototype
// Based on transcript analysis and screenshot reference

export interface Queue {
  id: string;
  name: string;
  group: string;
  slaSeconds: number;
  awtDay: number;        // Average Wait Time — за день
  awt10min: number;      // AWT за последние 10 минут
  awtCurrent: number;    // Текущее время ожидания
  queueDepth: number;    // Количество звонков в очереди
  availAgents: number;   // Свободные агенты
  totalAgents: number;   // Всего агентов в очереди
  idlePercent: number;   // % простоя
}

export interface Agent {
  id: string;
  name: string;
  login: string;
  extension: string;
  queue: string;
  status: 'online' | 'break' | 'offline' | 'call';
  callsToday: number;
  talkTime: number;      // секунды
  waitTime: number;      // секунды
  avgCallDuration: number;
  statusSince: string;   // ISO timestamp
}

export interface QueueGroup {
  name: string;
  queues: Queue[];
}

export const queueGroups: QueueGroup[] = [
  {
    name: 'Входящие линии',
    queues: [
      { id: 'q1', name: 'Продажи', group: 'Входящие линии', slaSeconds: 30, awtDay: 45, awt10min: 62, awtCurrent: 28, queueDepth: 3, availAgents: 1, totalAgents: 5, idlePercent: 12 },
      { id: 'q2', name: 'Поддержка', group: 'Входящие линии', slaSeconds: 60, awtDay: 118, awt10min: 95, awtCurrent: 72, queueDepth: 7, availAgents: 0, totalAgents: 8, idlePercent: 5 },
      { id: 'q3', name: 'Тех. отдел', group: 'Входящие линии', slaSeconds: 90, awtDay: 32, awt10min: 15, awtCurrent: 0, queueDepth: 0, availAgents: 3, totalAgents: 4, idlePercent: 35 },
      { id: 'q4', name: 'Биллинг', group: 'Входящие линии', slaSeconds: 30, awtDay: 22, awt10min: 18, awtCurrent: 5, queueDepth: 1, availAgents: 2, totalAgents: 3, idlePercent: 28 },
      { id: 'q5', name: 'VIP-клиенты', group: 'Входящие линии', slaSeconds: 20, awtDay: 8, awt10min: 4, awtCurrent: 0, queueDepth: 0, availAgents: 2, totalAgents: 2, idlePercent: 40 },
      { id: 'q6', name: 'Мультискилл', group: 'Входящие линии', slaSeconds: 60, awtDay: 88, awt10min: 120, awtCurrent: 95, queueDepth: 12, availAgents: 0, totalAgents: 6, idlePercent: 2 },
    ],
  },
  {
    name: 'Исходящие линии',
    queues: [
      { id: 'q7', name: 'Обзвон B2B', group: 'Исходящие линии', slaSeconds: 0, awtDay: 0, awt10min: 0, awtCurrent: 0, queueDepth: 0, availAgents: 2, totalAgents: 4, idlePercent: 50 },
      { id: 'q8', name: 'Опросы', group: 'Исходящие линии', slaSeconds: 0, awtDay: 0, awt10min: 0, awtCurrent: 0, queueDepth: 0, availAgents: 1, totalAgents: 2, idlePercent: 50 },
    ],
  },
];

export const agents: Agent[] = [
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

// Helper: get status color class
export function getAwtColor(value: number, sla: number): string {
  if (sla === 0) return 'text-muted-foreground';
  if (value === 0) return 'text-emerald-600 font-semibold';
  if (value <= sla * 0.5) return 'text-emerald-600 font-semibold';
  if (value <= sla) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

export function getQueueDepthColor(value: number): string {
  if (value === 0) return 'text-emerald-600 font-semibold';
  if (value <= 3) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

export function getAvailColor(value: number, total: number): string {
  if (value > 0) return 'text-emerald-600 font-semibold';
  if (total === 0) return 'text-muted-foreground';
  return 'text-red-600 font-semibold';
}

export function getStatusColor(status: Agent['status']): string {
  switch (status) {
    case 'online': return 'bg-emerald-500';
    case 'call': return 'bg-blue-500';
    case 'break': return 'bg-amber-500';
    case 'offline': return 'bg-zinc-400';
  }
}

export function getStatusLabel(status: Agent['status']): string {
  switch (status) {
    case 'online': return 'На линии';
    case 'call': return 'Разговор';
    case 'break': return 'Перерыв';
    case 'offline': return 'Отключён';
  }
}

export function formatSeconds(sec: number): string {
  if (sec === 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Simulate random fluctuation for real-time feel
export function fluctuate(value: number, maxDelta: number, min = 0): number {
  const delta = Math.round((Math.random() - 0.5) * 2 * maxDelta);
  return Math.max(min, value + delta);
}
