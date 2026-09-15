export type Feasibility = 'can-do' | 'cannot-do';

export interface CJStep {
  id: string;
  label: string;
  description: string;
  /** Widget type tag: Навигация / Оперативный / Агрегированный / Круговая / Карточки */
  tag?: string;
  /** Which periods this widget is available for */
  periods?: string[];
  /** Pre-filled feasibility from dev team assessment */
  defaultFeasibility?: Feasibility;
  /** Dev team comment explaining why */
  devComment?: string;
}

export interface StepData {
  feasibility: Feasibility | null;
  comment: string;
}

export type StepsState = Record<string, StepData>;

// Kept for backward compat in report builder
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
