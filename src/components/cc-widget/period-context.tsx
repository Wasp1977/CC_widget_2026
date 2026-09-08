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

// ---- Call Center Types ----
export interface CallCenter {
  id: string;
  name: string;
  shortName: string;
}

export const CALL_CENTERS: CallCenter[] = [
  { id: 'all', name: 'Все колл-центры', shortName: 'Все' },
  { id: 'cc1', name: 'МТС Контакт-центр', shortName: 'МТС' },
  { id: 'cc2', name: 'Билайн Сервис', shortName: 'Билайн' },
  { id: 'cc3', name: 'МегаФон Поддержка', shortName: 'МегаФон' },
];

// ---- Department stats ----
export interface DeptHistoricalStats {
  name: string;
  calls: number;
  avgWait: number;        // seconds
  slaCompliance: number;  // 0..100
  abandoned: number;
  avgHandleTime: number;  // seconds
  peakHour: number;       // 0-23
}

// ---- The 8 specified metrics ----
export interface LiveMetrics {
  /** 7. Текущее количество операторов на линии */
  currentOperatorsOnline: number;
  /** 8. Текущее количество звонков в очереди */
  currentCallsInQueue: number;
}

export interface AggregatedMetrics {
  /** 1. Принято звонков колл-центром */
  callsAnswered: number;
  /** 2. Среднее количество операторов на линии */
  avgOperatorsOnline: number;
  /** 3. Повесили трубку до ответа оператора */
  callsAbandoned: number;
  /** 4. Превышено время ожидания в очереди */
  waitTimeExceeded: number;
  /** 5. Среднее время разговора */
  avgTalkTime: number;      // seconds
  /** 6. Среднее время ожидания */
  avgWaitTime: number;      // seconds
}

// ---- Full period data ----
export interface PeriodData {
  period: Period;
  callCenterId: string;

  // ── Live metrics (always "now", period-independent) ──
  live: LiveMetrics;

  // ── Aggregated metrics (change with period) ──
  aggregated: AggregatedMetrics;

  // ── Extra for department/charts ──
  abandonedRate: number;         // %
  serviceLevel: number;          // % (80/20)
  slaCompliancePercent: number;  // overall %
  avgCallsPerDay: number;

  // ── Per-department breakdown ──
  departmentStats: DeptHistoricalStats[];

  // ── Queue depth distribution (only for live display) ──
  queueDepthDistribution?: { name: string; depth: number }[];
}

// ---- Context ----
interface PeriodContextValue {
  period: Period;
  setPeriod: (p: Period) => void;
  callCenter: CallCenter;
  setCallCenter: (cc: CallCenter) => void;
  periodData: PeriodData;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider');
  return ctx;
}

// ---- Mock data generators ----
function generatePeriodData(period: Period, ccId: string): PeriodData {
  // CC-specific multiplier
  const ccFactor = ccId === 'cc1' ? 1.0 : ccId === 'cc2' ? 0.7 : ccId === 'cc3' ? 0.5 : 1.0; // 'all' = 1.0
  const f = ccFactor;

  // Live metrics are always the same regardless of period
  const live: LiveMetrics = {
    currentOperatorsOnline: Math.round(9 * f),
    currentCallsInQueue: Math.round(23 * f),
  };

  switch (period) {
    case '1h':
      return {
        period: '1h', callCenterId: ccId, live,
        aggregated: {
          callsAnswered: Math.round(87 * f),
          avgOperatorsOnline: Math.round(8 * f * 10) / 10,
          callsAbandoned: Math.round(5 * f),
          waitTimeExceeded: Math.round(12 * f),
          avgTalkTime: Math.round(248),
          avgWaitTime: Math.round(42),
        },
        abandonedRate: 5.7, serviceLevel: 72, slaCompliancePercent: 67, avgCallsPerDay: Math.round(87 * f),
        queueDepthDistribution: [
          { name: 'Мультискилл', depth: Math.round(12 * f) },
          { name: 'Поддержка', depth: Math.round(7 * f) },
          { name: 'Продажи', depth: Math.round(3 * f) },
          { name: 'Биллинг', depth: Math.round(1 * f) },
        ],
        departmentStats: [
          { name: 'Входящие линии', calls: Math.round(78 * f), avgWait: 48, slaCompliance: 65, abandoned: Math.round(5 * f), avgHandleTime: 256, peakHour: 11 },
          { name: 'Исходящие линии', calls: Math.round(9 * f), avgWait: 0, slaCompliance: 100, abandoned: 0, avgHandleTime: 180, peakHour: 14 },
        ],
      };

    case 'today':
      return {
        period: 'today', callCenterId: ccId, live,
        aggregated: {
          callsAnswered: Math.round(412 * f),
          avgOperatorsOnline: Math.round(7.8 * f * 10) / 10,
          callsAbandoned: Math.round(23 * f),
          waitTimeExceeded: Math.round(38 * f),
          avgTalkTime: 252,
          avgWaitTime: 46,
        },
        abandonedRate: 5.6, serviceLevel: 75, slaCompliancePercent: 72, avgCallsPerDay: Math.round(412 * f),
        queueDepthDistribution: [
          { name: 'Мультискилл', depth: Math.round(12 * f) },
          { name: 'Поддержка', depth: Math.round(7 * f) },
          { name: 'Продажи', depth: Math.round(3 * f) },
          { name: 'Биллинг', depth: Math.round(1 * f) },
        ],
        departmentStats: [
          { name: 'Входящие линии', calls: Math.round(368 * f), avgWait: 48, slaCompliance: 70, abandoned: Math.round(22 * f), avgHandleTime: 261, peakHour: 11 },
          { name: 'Исходящие линии', calls: Math.round(44 * f), avgWait: 0, slaCompliance: 100, abandoned: Math.round(1 * f), avgHandleTime: 185, peakHour: 15 },
        ],
      };

    case '7d':
      return {
        period: '7d', callCenterId: ccId, live,
        aggregated: {
          callsAnswered: Math.round(2847 * f),
          avgOperatorsOnline: Math.round(7.6 * f * 10) / 10,
          callsAbandoned: Math.round(152 * f),
          waitTimeExceeded: Math.round(224 * f),
          avgTalkTime: 246,
          avgWaitTime: 44,
        },
        abandonedRate: 5.3, serviceLevel: 80, slaCompliancePercent: 78, avgCallsPerDay: Math.round(407 * f),
        departmentStats: [
          { name: 'Входящие линии', calls: Math.round(2534 * f), avgWait: 47, slaCompliance: 76, abandoned: Math.round(148 * f), avgHandleTime: 258, peakHour: 11 },
          { name: 'Исходящие линии', calls: Math.round(313 * f), avgWait: 2, slaCompliance: 98, abandoned: Math.round(4 * f), avgHandleTime: 182, peakHour: 14 },
        ],
      };

    case '30d':
      return {
        period: '30d', callCenterId: ccId, live,
        aggregated: {
          callsAnswered: Math.round(12380 * f),
          avgOperatorsOnline: Math.round(7.9 * f * 10) / 10,
          callsAbandoned: Math.round(612 * f),
          waitTimeExceeded: Math.round(890 * f),
          avgTalkTime: 244,
          avgWaitTime: 42,
        },
        abandonedRate: 4.9, serviceLevel: 83, slaCompliancePercent: 82, avgCallsPerDay: Math.round(413 * f),
        departmentStats: [
          { name: 'Входящие линии', calls: Math.round(11024 * f), avgWait: 45, slaCompliance: 80, abandoned: Math.round(598 * f), avgHandleTime: 254, peakHour: 11 },
          { name: 'Исходящие линии', calls: Math.round(1356 * f), avgWait: 3, slaCompliance: 97, abandoned: Math.round(14 * f), avgHandleTime: 178, peakHour: 15 },
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
  const [callCenter, setCallCenter] = useState<CallCenter>(CALL_CENTERS[0]);

  const periodData = useMemo(() => generatePeriodData(period, callCenter.id), [period, callCenter.id]);

  const value = useMemo(() => ({
    period,
    setPeriod: useCallback((p: Period) => setPeriod(p), []),
    callCenter,
    setCallCenter: useCallback((cc: CallCenter) => setCallCenter(cc), []),
    periodData,
  }), [period, callCenter, periodData]);

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}
