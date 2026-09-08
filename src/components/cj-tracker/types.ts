export interface CJStep {
  id: string;
  label: string;
  description: string;
  /** Which periods this widget is available for */
  periods?: ('1h' | 'today' | '7d' | '30d')[];
  /** Widget type tag shown as badge */
  tag?: string;
}

/** Feasibility assessment — replaces emoji rating */
export type Feasibility = 'can-do' | 'cannot-do';

export interface StepData {
  feasibility: Feasibility | null;
  comment: string;
}

export type StepsState = Record<string, StepData>;

// Keep for backward compatibility with reports API
export interface CJRating {
  emoji: string;
  label: string;
  value: number;
}

export const RATINGS: CJRating[] = [
  { emoji: '😞', label: 'Разочарование', value: 1 },
  { emoji: '☹️', label: 'Затруднение', value: 2 },
  { emoji: '😕', label: 'Непонимание', value: 3 },
  { emoji: '😐', label: 'Нейтрально', value: 4 },
  { emoji: '🙂', label: 'Ожидание', value: 5 },
  { emoji: '😊', label: 'Удобно', value: 6 },
  { emoji: '😄', label: 'Интуитивно', value: 7 },
];

export interface ReportPayload {
  participantName: string;
  participantEmail: string;
  scenarioName: string;
  steps: CJStep[];
  state: StepsState;
  submittedAt: string;
}

export interface ReportFileMeta {
  id: string;
  filename: string;
  participantName: string;
  submittedAt: string;
  size: number;
}
