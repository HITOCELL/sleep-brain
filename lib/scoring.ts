import { DiagnosisResult, SleepTypeKey } from './types';
import { sleepTypes } from './types-data';

type TypeScores = Record<SleepTypeKey, number>;

function addScore(scores: TypeScores, key: SleepTypeKey, amount: number) {
  scores[key] = (scores[key] || 0) + amount;
}

const TYPE_PRIORITY: SleepTypeKey[] = [
  'fatigue',
  'autonomic',
  'insomnia',
  'wakeup',
  'performance',
  'beauty',
];

const Q19_TYPE_MAP: Record<string, SleepTypeKey> = {
  A: 'insomnia',
  B: 'wakeup',
  C: 'fatigue',
  D: 'fatigue',
  E: 'beauty',
  F: 'performance',
  G: 'wakeup',
};

function applyQuestionScore(
  qNum: number,
  v: string,
  scores: TypeScores
) {
  switch (qNum) {
    case 4:
      if (v === 'A') { addScore(scores, 'fatigue', 4); addScore(scores, 'performance', 4); addScore(scores, 'beauty', 3); addScore(scores, 'autonomic', 2); }
      else if (v === 'B') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 3); addScore(scores, 'beauty', 2); addScore(scores, 'autonomic', 1); }
      else if (v === 'C') { addScore(scores, 'fatigue', 1); addScore(scores, 'performance', 1); }
      else if (v === 'E') { addScore(scores, 'fatigue', 1); addScore(scores, 'wakeup', 1); }
      break;
    case 5:
      if (v === 'B') addScore(scores, 'insomnia', 1);
      else if (v === 'C') { addScore(scores, 'insomnia', 3); addScore(scores, 'autonomic', 1); }
      else if (v === 'D') { addScore(scores, 'insomnia', 4); addScore(scores, 'autonomic', 2); addScore(scores, 'performance', 1); }
      else if (v === 'E') { addScore(scores, 'insomnia', 4); addScore(scores, 'autonomic', 3); addScore(scores, 'performance', 2); }
      break;
    case 6:
      if (v === 'B') addScore(scores, 'wakeup', 1);
      else if (v === 'C') { addScore(scores, 'wakeup', 3); addScore(scores, 'fatigue', 1); }
      else if (v === 'D') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 1); }
      else if (v === 'E') { addScore(scores, 'wakeup', 4); addScore(scores, 'insomnia', 2); addScore(scores, 'autonomic', 2); }
      break;
    case 7:
      if (v === 'B') addScore(scores, 'fatigue', 1);
      else if (v === 'C') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); addScore(scores, 'beauty', 1); }
      else if (v === 'D') { addScore(scores, 'fatigue', 4); addScore(scores, 'wakeup', 2); addScore(scores, 'performance', 2); }
      else if (v === 'E') { addScore(scores, 'fatigue', 3); addScore(scores, 'autonomic', 3); addScore(scores, 'performance', 3); }
      break;
    case 8:
      if (v === 'B') addScore(scores, 'fatigue', 1);
      else if (v === 'C') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); }
      else if (v === 'D') { addScore(scores, 'fatigue', 4); addScore(scores, 'performance', 4); }
      else if (v === 'E') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); addScore(scores, 'wakeup', 1); }
      break;
    case 9:
      if (v === 'B') { addScore(scores, 'wakeup', 2); addScore(scores, 'fatigue', 1); }
      else if (v === 'C') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); }
      else if (v === 'D') { addScore(scores, 'wakeup', 2); addScore(scores, 'fatigue', 1); }
      else if (v === 'E') addScore(scores, 'wakeup', 1);
      break;
    case 10:
      if (v === 'B') addScore(scores, 'insomnia', 1);
      else if (v === 'C') { addScore(scores, 'insomnia', 3); addScore(scores, 'beauty', 1); addScore(scores, 'performance', 1); }
      else if (v === 'D') { addScore(scores, 'insomnia', 4); addScore(scores, 'beauty', 2); addScore(scores, 'performance', 2); }
      else if (v === 'E') { addScore(scores, 'insomnia', 4); addScore(scores, 'beauty', 2); addScore(scores, 'fatigue', 2); }
      break;
    case 11:
      if (v === 'C') addScore(scores, 'insomnia', 1);
      else if (v === 'D') { addScore(scores, 'insomnia', 3); addScore(scores, 'wakeup', 1); }
      else if (v === 'E') { addScore(scores, 'insomnia', 4); addScore(scores, 'wakeup', 2); addScore(scores, 'performance', 1); }
      break;
    case 12:
      if (v === 'B') addScore(scores, 'wakeup', 1);
      else if (v === 'C') { addScore(scores, 'wakeup', 2); addScore(scores, 'fatigue', 1); addScore(scores, 'beauty', 1); }
      else if (v === 'D') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 2); addScore(scores, 'beauty', 2); }
      else if (v === 'E') { addScore(scores, 'wakeup', 4); addScore(scores, 'insomnia', 2); addScore(scores, 'autonomic', 3); }
      break;
    case 13:
      if (v === 'B') { addScore(scores, 'fatigue', 1); addScore(scores, 'autonomic', 1); addScore(scores, 'beauty', 1); }
      else if (v === 'C') { addScore(scores, 'insomnia', 1); addScore(scores, 'wakeup', 1); }
      else if (v === 'D') { addScore(scores, 'autonomic', 2); addScore(scores, 'wakeup', 1); addScore(scores, 'fatigue', 1); }
      else if (v === 'E') { addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 2); addScore(scores, 'beauty', 2); }
      break;
    case 14:
      if (v === 'B') addScore(scores, 'fatigue', 1);
      else if (v === 'C') { addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 1); addScore(scores, 'beauty', 1); }
      else if (v === 'D') { addScore(scores, 'fatigue', 3); addScore(scores, 'autonomic', 2); addScore(scores, 'performance', 1); }
      else if (v === 'E') { addScore(scores, 'fatigue', 4); addScore(scores, 'performance', 3); addScore(scores, 'autonomic', 2); }
      break;
    case 15:
      if (v === 'B') addScore(scores, 'autonomic', 1);
      else if (v === 'C') { addScore(scores, 'autonomic', 3); addScore(scores, 'insomnia', 2); addScore(scores, 'performance', 1); }
      else if (v === 'D') { addScore(scores, 'autonomic', 4); addScore(scores, 'insomnia', 3); addScore(scores, 'performance', 2); }
      else if (v === 'E') { addScore(scores, 'autonomic', 4); addScore(scores, 'insomnia', 4); addScore(scores, 'performance', 2); }
      break;
    case 16:
      if (v === 'B') { addScore(scores, 'autonomic', 3); addScore(scores, 'fatigue', 1); }
      else if (v === 'C') { addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 2); }
      else if (v === 'D') { addScore(scores, 'autonomic', 3); addScore(scores, 'performance', 2); }
      else if (v === 'E') { addScore(scores, 'autonomic', 4); addScore(scores, 'insomnia', 1); addScore(scores, 'wakeup', 1); }
      break;
    case 17:
      if (v === 'B') { addScore(scores, 'beauty', 3); addScore(scores, 'fatigue', 1); }
      else if (v === 'C') { addScore(scores, 'beauty', 3); addScore(scores, 'fatigue', 1); }
      else if (v === 'D') { addScore(scores, 'beauty', 4); addScore(scores, 'wakeup', 1); }
      else if (v === 'E') { addScore(scores, 'beauty', 4); addScore(scores, 'fatigue', 2); }
      break;
    case 18:
      if (v === 'B') addScore(scores, 'performance', 1);
      else if (v === 'C') { addScore(scores, 'performance', 3); addScore(scores, 'fatigue', 1); }
      else if (v === 'D') { addScore(scores, 'performance', 4); addScore(scores, 'fatigue', 2); }
      else if (v === 'E') { addScore(scores, 'performance', 4); addScore(scores, 'autonomic', 3); addScore(scores, 'fatigue', 1); }
      break;
    case 19:
      if (v === 'A') addScore(scores, 'insomnia', 5);
      else if (v === 'B') addScore(scores, 'wakeup', 5);
      else if (v === 'C') { addScore(scores, 'fatigue', 4); addScore(scores, 'wakeup', 2); }
      else if (v === 'D') addScore(scores, 'fatigue', 5);
      else if (v === 'E') addScore(scores, 'beauty', 5);
      else if (v === 'F') addScore(scores, 'performance', 5);
      else if (v === 'G') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 2); }
      break;
  }
}

const SCORE_MAP: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

export function calculateResult(answers: string[][]): DiagnosisResult {
  const scores: TypeScores = {
    insomnia: 0,
    wakeup: 0,
    fatigue: 0,
    autonomic: 0,
    beauty: 0,
    performance: 0,
  };

  // answers[0] = Q1 selections, answers[3] = Q4 selections, etc.
  const q = (n: number): string[] => answers[n - 1] ?? [];

  // Severity totalScore from Q4-Q18 (sum of all selected severities per question)
  let totalScore = 0;
  for (let i = 4; i <= 18; i++) {
    for (const v of q(i)) {
      totalScore += SCORE_MAP[v] ?? 0;
    }
  }

  // Apply per-type scoring (Q4-Q18)
  for (let i = 4; i <= 18; i++) {
    for (const v of q(i)) {
      applyQuestionScore(i, v, scores);
    }
  }

  // Q19 type intent (single)
  const q19First = q(19)[0] ?? '';
  applyQuestionScore(19, q19First, scores);
  const q19TypeKey = Q19_TYPE_MAP[q19First];

  // Determine main / sub type
  const sortedTypes = (Object.keys(scores) as SleepTypeKey[]).sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    if (a === q19TypeKey) return -1;
    if (b === q19TypeKey) return 1;
    return TYPE_PRIORITY.indexOf(a) - TYPE_PRIORITY.indexOf(b);
  });
  const mainTypeKey = sortedTypes[0];
  const subTypeKey = sortedTypes[1];

  // Zone (recalibrated for multi-select totals)
  let zone: string;
  let zoneColor: string;
  if (totalScore <= 20) {
    zone = '睡眠安定ゾーン';
    zoneColor = 'bg-teal-100 text-teal-700';
  } else if (totalScore <= 45) {
    zone = '睡眠見直しゾーン';
    zoneColor = 'bg-blue-100 text-blue-700';
  } else if (totalScore <= 75) {
    zone = '睡眠課題蓄積ゾーン';
    zoneColor = 'bg-amber-100 text-amber-700';
  } else {
    zone = '睡眠優先改善ゾーン';
    zoneColor = 'bg-red-100 text-red-700';
  }

  // Display deviation: capped 15-70, biased lower
  const rawDeviation = Math.round(65 - totalScore * 0.5);
  const sleepDeviation = Math.max(15, Math.min(70, rawDeviation));

  return {
    totalScore,
    sleepDeviation,
    zone,
    zoneColor,
    mainType: sleepTypes[mainTypeKey],
    subType: sleepTypes[subTypeKey],
    typeScores: scores,
    q20Answer: q(20)[0] ?? '',
    q1Answer: q(1)[0] ?? '',
    q2Answer: q(2)[0] ?? '',
  };
}
