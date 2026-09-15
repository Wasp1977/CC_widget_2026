'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ---- Period Types ----
export type Period = '1h' | '1d' | '7d' | '30d' | 'quarter' | 'year';

export const PERIOD_LABELS: Record<Period, string> = {
  '1h': 'Час',
  '1d': 'Сутки',
  '7d': 'Неделя',
  '30d': 'Месяц',
  'quarter': 'Квартал',
  'year': 'Год',
};

export const PERIOD_ORDER: Period[] = ['1h', '1d', '7d', '30d', 'quarter', 'year'];

/** True if the period represents a real-time / current snapshot */
export function isRealtimePeriod(p: Period): boolean {
  return p === '1h';
}

/** True if the period is retrospective (historical) */
export function isRetrospectivePeriod(p: Period): boolean {
  return p === '7d' || p === '30d' || p === 'quarter' || p === 'year';
}

// ---- Call Center Types ----
export interface CallCenter {
  id: string;
  name: string;
  shortName: string;
}

export const CALL_CENTERS: CallCenter[] = [
  { id: 'all', name: 'Все колл-центры', shortName: 'Все' },
  { id: 'cc1', name: 'Продажи Пермь', shortName: 'Пермь' },
  { id: 'cc2', name: 'Продажи Москва', shortName: 'Москва' },
  { id: 'cc3', name: 'Продажи Санкт-Петербург', shortName: 'СПб' },
];

// ---- Bar chart data point ----
export interface BarDataPoint {
  label: string;
  value: number;
}

// ---- SLA bar data per queue ----
export interface SlaBarData {
  queue: string;
  slaTarget: number;   // seconds
  avgWait: number;     // seconds actual
  compliance: number;  // 0..100
}

// ---- Live Metrics ----
export interface LiveMetrics {
  currentOperatorsOnline: number;
  currentCallsInQueue: number;
}

// ---- Full period data ----
export interface PeriodData {
  period: Period;
  callCenterId: string;
  live: LiveMetrics;

  // ── Bar chart data for operators online by period granularity ──
  operatorsOnlineBars: BarDataPoint[];
  // ── Bar chart data for calls in queue by period granularity ──
  callsInQueueBars: BarDataPoint[];
  // ── SLA per-queue bar data ──
  slaBarData: SlaBarData[];

  // ── Queue depth distribution for pie chart ──
  queueDepthDistribution: { name: string; depth: number }[];
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

// ---- Seeded random for consistent mock data ----
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ---- Mock data generators ----
export function generatePeriodData(period: Period, ccId: string): PeriodData {
  const ccFactor = ccId === 'cc1' ? 1.0 : ccId === 'cc2' ? 0.7 : ccId === 'cc3' ? 0.5 : 1.0;
  const f = ccFactor;

  const live: LiveMetrics = {
    currentOperatorsOnline: Math.round(9 * f),
    currentCallsInQueue: Math.round(23 * f),
  };

  // Generate bar data based on period granularity
  const operatorsOnlineBars = generateBars(period, f, 9, 3, 'ops');
  const callsInQueueBars = generateBars(period, f, 23, 10, 'queue');

  // SLA per-queue bar data
  const slaBarData: SlaBarData[] = [
    { queue: 'Продажи', slaTarget: 30, avgWait: 28, compliance: 85 },
    { queue: 'Поддержка', slaTarget: 60, avgWait: 72, compliance: 58 },
    { queue: 'Тех. отдел', slaTarget: 90, avgWait: 15, compliance: 100 },
    { queue: 'Биллинг', slaTarget: 30, avgWait: 22, compliance: 92 },
    { queue: 'VIP-клиенты', slaTarget: 20, avgWait: 4, compliance: 98 },
    { queue: 'Мультискилл', slaTarget: 60, avgWait: 95, compliance: 42 },
  ].map(d => ({
    ...d,
    avgWait: Math.round(d.avgWait * f + (1 - f) * 5),
    compliance: Math.round(d.compliance * (0.5 + 0.5 * f)),
  }));

  const queueDepthDistribution = [
    { name: 'Мультискилл', depth: Math.round(12 * f) },
    { name: 'Поддержка', depth: Math.round(7 * f) },
    { name: 'Продажи', depth: Math.round(3 * f) },
    { name: 'Биллинг', depth: Math.round(1 * f) },
  ];

  return {
    period, callCenterId: ccId, live,
    operatorsOnlineBars, callsInQueueBars, slaBarData,
    queueDepthDistribution,
  };
}

// ---- Bar data generator by period ----
function generateBars(
  period: Period,
  factor: number,
  baseValue: number,
  variance: number,
  seedPrefix: string,
): BarDataPoint[] {
  const seedBase = hashStr(seedPrefix);

  switch (period) {
    case '1h':
      // Single large value — no bars
      return [{
        label: 'Сейчас',
        value: Math.round(baseValue * factor),
      }];

    case '1d': {
      // 24 bars by hour
      return Array.from({ length: 24 }, (_, h) => ({
        label: `${h}`,
        value: Math.round(
          baseValue * factor
          * (0.4 + 0.6 * hourWeight(h))
          + (seededRandom(seedBase + h) - 0.5) * variance * factor
        ),
      }));
    }

    case '7d': {
      // 7 bars by day of week
      const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      return dayNames.map((d, i) => ({
        label: d,
        value: Math.round(
          baseValue * factor
          * (i < 5 ? 1.0 : 0.5)  // weekends lower
          + (seededRandom(seedBase + i + 100) - 0.5) * variance * factor
        ),
      }));
    }

    case '30d': {
      // 30 bars by day of month
      return Array.from({ length: 30 }, (_, i) => ({
        label: `${i + 1}`,
        value: Math.round(
          baseValue * factor
          + (seededRandom(seedBase + i + 200) - 0.5) * variance * factor * 1.5
        ),
      }));
    }

    case 'quarter': {
      // ~13 bars by week
      return Array.from({ length: 13 }, (_, i) => ({
        label: `Н${i + 1}`,
        value: Math.round(
          baseValue * factor
          + (seededRandom(seedBase + i + 300) - 0.5) * variance * factor * 1.2
        ),
      }));
    }

    case 'year': {
      // 12 bars by month
      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      return monthNames.map((m, i) => ({
        label: m,
        value: Math.round(
          baseValue * factor
          * (0.85 + 0.15 * Math.sin((i - 2) * Math.PI / 6))  // seasonal curve
          + (seededRandom(seedBase + i + 400) - 0.5) * variance * factor
        ),
      }));
    }
  }
}

/** Hour weight: peaks at 10-11 and 14-15, drops at night */
function hourWeight(h: number): number {
  if (h < 6) return 0.2;
  if (h < 8) return 0.5 + (h - 6) * 0.15;
  if (h < 12) return 0.9 + 0.1 * Math.sin((h - 8) * Math.PI / 4);
  if (h < 14) return 0.7;
  if (h < 18) return 0.85 + 0.1 * Math.sin((h - 14) * Math.PI / 4);
  if (h < 20) return 0.6;
  return 0.3;
}

/** Simple string hash for seed */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---- Provider ----
interface PeriodProviderProps {
  children: React.ReactNode;
}

export function PeriodProvider({ children }: PeriodProviderProps) {
  const [period, setPeriod] = useState<Period>('1d');
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
