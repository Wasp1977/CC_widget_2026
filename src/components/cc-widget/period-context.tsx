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

  // SLA per-queue bar data — period-dependent
  const slaBarData = generateSlaData(period, f);

  // Queue depth distribution — period-dependent
  const queueDepthDistribution = generateQueueDepth(period, f);

  return {
    period, callCenterId: ccId, live,
    operatorsOnlineBars, callsInQueueBars, slaBarData,
    queueDepthDistribution,
  };
}

// ---- SLA data generator by period ----
function generateSlaData(period: Period, f: number): SlaBarData[] {
  // Base SLA profiles per queue — compliance %, avgWait seconds, slaTarget seconds
  const baseProfiles = [
    { queue: 'Продажи',     slaTarget: 30, baseCompliance: 85, baseAvgWait: 28 },
    { queue: 'Поддержка',   slaTarget: 60, baseCompliance: 58, baseAvgWait: 72 },
    { queue: 'Тех. отдел',  slaTarget: 90, baseCompliance: 100, baseAvgWait: 15 },
    { queue: 'Биллинг',     slaTarget: 30, baseCompliance: 92, baseAvgWait: 22 },
    { queue: 'VIP-клиенты', slaTarget: 20, baseCompliance: 98, baseAvgWait: 4 },
    { queue: 'Мультискилл', slaTarget: 60, baseCompliance: 42, baseAvgWait: 95 },
  ];

  // Period modifiers: shorter periods are more volatile, longer are smoother
  const periodMod: Record<Period, { complianceScale: number; complianceNoise: number; waitScale: number; waitNoise: number }> = {
    '1h':      { complianceScale: 1.0,  complianceNoise: 12, waitScale: 1.0,  waitNoise: 15 },
    '1d':      { complianceScale: 0.95, complianceNoise: 8,  waitScale: 0.9,  waitNoise: 10 },
    '7d':      { complianceScale: 0.9,  complianceNoise: 5,  waitScale: 0.8,  waitNoise: 7 },
    '30d':     { complianceScale: 0.85, complianceNoise: 3,  waitScale: 0.7,  waitNoise: 5 },
    'quarter': { complianceScale: 0.82, complianceNoise: 2,  waitScale: 0.65, waitNoise: 3 },
    'year':    { complianceScale: 0.78, complianceNoise: 1,  waitScale: 0.6,  waitNoise: 2 },
  };

  const mod = periodMod[period];
  const seedBase = hashStr('sla');

  return baseProfiles.map((p, i) => {
    const noise = seededRandom(seedBase + i * 17 + hashStr(period)) - 0.5;
    const compliance = Math.min(100, Math.max(0,
      Math.round(p.baseCompliance * mod.complianceScale * (0.5 + 0.5 * f) + noise * mod.complianceNoise)
    ));
    const avgWait = Math.max(0,
      Math.round(p.baseAvgWait * mod.waitScale * f + noise * mod.waitNoise)
    );
    return {
      queue: p.queue,
      slaTarget: p.slaTarget,
      avgWait,
      compliance,
    };
  });
}

// ---- Queue depth distribution generator by period ----
function generateQueueDepth(period: Period, f: number): { name: string; depth: number }[] {
  // Base depths per department
  const baseDepths = [
    { name: 'Мультискилл', base: 12 },
    { name: 'Поддержка',   base: 7 },
    { name: 'Продажи',     base: 3 },
    { name: 'Биллинг',     base: 1 },
    { name: 'VIP-клиенты', base: 0.5 },
    { name: 'Тех. отдел',  base: 0.2 },
  ];

  // Period multiplier: shorter periods show current spikes, longer show averages
  const periodFactor: Record<Period, number> = {
    '1h':      1.0,   // live snapshot
    '1d':      0.85,  // daily average slightly lower (off-peak hours bring average down)
    '7d':      0.75,  // weekly average (weekends reduce)
    '30d':     0.7,   // monthly average
    'quarter': 0.65,  // quarterly average
    'year':    0.6,   // yearly average (most smoothed)
  };

  const pf = periodFactor[period];
  const seedBase = hashStr('qdepth');

  return baseDepths.map((d, i) => {
    const noise = seededRandom(seedBase + i * 13 + hashStr(period)) - 0.5;
    const depth = Math.max(0, Math.round(d.base * f * pf + noise * f * 1.5));
    return { name: d.name, depth };
  }).filter(d => d.depth > 0);  // hide departments with 0 depth
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
    case '1h': {
      // 12 bars by 5-minute intervals — current time on the right, 60 min back
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = currentMinutes - 55; // first bar is 55 min ago
      return Array.from({ length: 12 }, (_, i) => {
        const mins = startMinutes + i * 5;
        const hh = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
        const mm = ((mins % 60) + 60) % 60;
        return {
          label: `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`,
          value: Math.round(
            baseValue * factor
            * (0.6 + 0.4 * hourWeight(hh + mm / 60))
            + (seededRandom(seedBase + i + 500) - 0.5) * variance * factor
          ),
        };
      });
    }

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
