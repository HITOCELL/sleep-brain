export type Answer = string;

export type SleepTypeKey =
  | 'insomnia'
  | 'wakeup'
  | 'fatigue'
  | 'autonomic'
  | 'beauty'
  | 'performance';

export interface SleepType {
  key: SleepTypeKey;
  name: string;
  description: string;
  commonProblems: string[];
  improvements: string[];
  todayActions: string[];
}

export interface DiagnosisResult {
  totalScore: number;
  sleepDeviation: number;
  zone: string;
  zoneColor: string;
  mainType: SleepType;
  subType: SleepType;
  typeScores: Record<SleepTypeKey, number>;
  q20Answer: string;
  q1Answer: string;
  q2Answer: string;
}

export interface Question {
  id: number;
  text: string;
  options: { label: string; value: string }[];
}
