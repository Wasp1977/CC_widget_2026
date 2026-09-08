'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ---- Period Types ----
export type Period = '1h' | 'today' | '7d' | '30d';

export const PERIOD_LABELS: Record<Period, string> = {
  '1h': '1 час',
  'today': 'Сегодня',
  '7d': '7 дней',
  '30d': 'Месяц',
};

export const PERIOD_ORDER: Period[] = ['1h', 'today', '7d', '30d'];

/** True if the period represents a real-time / current snapshot */
export function isRealtimePeriod(p: Period): boolean {
  return p === '1h' || p === 'today';
}

/** True if the period is retrospective (historical) */
export function isRetrospectivePeriod(p: Period): boolean {
  return p === '7d' || p === '30d';
}

// ---- Historical stats per department ----
export interface DeptHistoricalStats {
  name: string;
  calls: number;
  avgWait: number;        // seconds
  slaCompliance: number;  // 0..100
  abandoned: number;
  avgHandleTime: number;  // seconds
  peakHour: number;       // 0-23
}

// ---- Period-specific aggregated data ----
export interface PeriodData {
  period: Period;

  // ── Real-time metrics (1h / today only) ──
  currentQueueDepth?: number;
  currentOnlineAgents?: number;
  currentTotalAgents?: number;
  currentBreakAgents?: number;
  currentOfflineAgents?: number;
  currentSlaViolations?: number;
  currentAvgWait?: number;
  slaComplianceRate?: number;   // % queues in SLA
  queuesInSla?: number;
  totalInboundQueues?: number;
  queueDepthDistribution?: { name: string; depth: number }[];

  // ── Historical metrics (all periods, but primary for 7d / 30d) ──
  totalCalls: number;
  avgCallsPerDay: number;
  avgWaitTime: number;           // seconds
  slaCompliancePercent: number;  // overall %
  abandonedCalls: number;
  abandonedRate: number;         // %
  avgHandleTime: number;         // seconds
  serviceLevel: number;          // % (80/20 standard)

  // ── Per-department breakdown ──
  departmentStats: DeptHistoricalStats[];
}

// ---- Context ----
interface PeriodContextValue {
  period: Period;
  setPeriod: (p: Period) => void;
  periodData: PeriodData;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider');
  return ctx;
}

// ---- Mock data generators per period ----
function generatePeriodData(period: Period): PeriodData {
  const deptNames = ['Входящие линии', 'Исходящие линии'];
  const queueNames = ['Продажи', 'Поддержка', 'Тех. отдел', 'Биллинг', 'VIP-клиенты', 'Мультискилл'];

  switch (period) {
    case '1h':
      return {
        period: '1h',
        currentQueueDepth: 23,
        currentOnlineAgents: 9,
        currentTotalAgents: 12,
        currentBreakAgents: 2,
        currentOfflineAgents: 1,
        currentSlaViolations: 2,
        currentAvgWait: 48,
        slaComplianceRate: 67,
        queuesInSla: 4,
        totalInboundQueues: 6,
        queueDepthDistribution: [
          { name: 'Мультискилл', depth: 12 },
          { name: 'Поддержка', depth: 7 },
          { name: 'Продажи', depth: 3 },
          { name: 'Биллинг', depth: 1 },
        ],
        totalCalls: 87,
        avgCallsPerDay: 87,
        avgWaitTime: 42,
        slaCompliancePercent: 67,
        abandonedCalls: 5,
        abandonedRate: 5.7,
        avgHandleTime: 248,
        serviceLevel: 72,
        departmentStats: [
          { name: 'Входящие линии', calls: 78, avgWait: 48, slaCompliance: 65, abandoned: 5, avgHandleTime: 256, peakHour: 11 },
          { name: 'Исходящие линии', calls: 9, avgWait: 0, slaCompliance: 100, abandoned: 0, avgHandleTime: 180, peakHour: 14 },
        ],
      };

    case 'today':
      return {
        period: 'today',
        currentQueueDepth: 23,
        currentOnlineAgents: 9,
        currentTotalAgents: 12,
        currentBreakAgents: 2,
        currentOfflineAgents: 1,
        currentSlaViolations: 2,
        currentAvgWait: 52,
        slaComplianceRate: 67,
        queuesInSla: 4,
        totalInboundQueues: 6,
        queueDepthDistribution: [
          { name: 'Мультискилл', depth: 12 },
          { name: 'Поддержка', depth: 7 },
          { name: 'Продажи', depth: 3 },
          { name: 'Биллинг', depth: 1 },
        ],
        totalCalls: 412,
        avgCallsPerDay: 412,
        avgWaitTime: 46,
        slaCompliancePercent: 72,
        abandonedCalls: 23,
        abandonedRate: 5.6,
        avgHandleTime: 252,
        serviceLevel: 75,
        departmentStats: [
          { name: 'Входящие линии', calls: 368, avgWait: 48, slaCompliance: 70, abandoned: 22, avgHandleTime: 261, peakHour: 11 },
          { name: 'Исходящие линии', calls: 44, avgWait: 0, slaCompliance: 100, abandoned: 1, avgHandleTime: 185, peakHour: 15 },
        ],
      };

    case '7d':
      return {
        period: '7d',
        totalCalls: 2847,
        avgCallsPerDay: 407,
        avgWaitTime: 44,
        slaCompliancePercent: 78,
        abandonedCalls: 152,
        abandonedRate: 5.3,
        avgHandleTime: 246,
        serviceLevel: 80,
        departmentStats: [
          { name: 'Входящие линии', calls: 2534, avgWait: 47, slaCompliance: 76, abandoned: 148, avgHandleTime: 258, peakHour: 11 },
          { name: 'Исходящие линии', calls: 313, avgWait: 2, slaCompliance: 98, abandoned: 4, avgHandleTime: 182, peakHour: 14 },
        ],
      };

    case '30d':
      return {
        period: '30d',
        totalCalls: 12380,
        avgCallsPerDay: 413,
        avgWaitTime: 42,
        slaCompliancePercent: 82,
        abandonedCalls: 612,
        abandonedRate: 4.9,
        avgHandleTime: 244,
        serviceLevel: 83,
        departmentStats: [
          { name: 'Входящие линии', calls: 11024, avgWait: 45, slaCompliance: 80, abandoned: 598, avgHandleTime: 254, peakHour: 11 },
          { name: 'Исходящие линии', calls: 1356, avgWait: 3, slaCompliance: 97, abandoned: 14, avgHandleTime: 178, peakHour: 15 },
        ],
      };
  }
}

// ---- Provider ----
interface PeriodProviderProps {
  children: React.ReactNode;
}

export function PeriodProvider({ children }: PeriodProviderProps) {
  const [period, setPeriod] = useState<Period>('today');

  const periodData = useMemo(() => generatePeriodData(period), [period]);

  const value = useMemo(() => ({
    period,
    setPeriod: useCallback((p: Period) => setPeriod(p), []),
    periodData,
  }), [period, periodData]);

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}
