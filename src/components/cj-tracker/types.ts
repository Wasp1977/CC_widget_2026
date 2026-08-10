export interface CJStep {
  id: string;
  label: string;
  description: string;
}

export interface CJRating {
  emoji: string;
  label: string;
  value: number;
}

export interface StepData {
  rating: CJRating | null;
  comment: string;
}

export type StepsState = Record<string, StepData>;

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
