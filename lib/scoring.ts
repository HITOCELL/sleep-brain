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

export function calculateResult(answers: string[]): DiagnosisResult {
  const scores: TypeScores = {
    insomnia: 0,
    wakeup: 0,
    fatigue: 0,
    autonomic: 0,
    beauty: 0,
    performance: 0,
  };

  // answers[0] = Q1 answer, answers[3] = Q4 answer, etc.
  const q = (n: number) => answers[n - 1] ?? '';

  // Total score Q4-Q18 (A=0,B=1,C=2,D=3,E=4)
  const scoreMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
  let totalScore = 0;
  for (let i = 4; i <= 18; i++) {
    const val = q(i);
    totalScore += scoreMap[val] ?? 0;
  }

  // Q4
  const q4 = q(4);
  if (q4 === 'A') { addScore(scores, 'fatigue', 4); addScore(scores, 'performance', 4); addScore(scores, 'beauty', 3); addScore(scores, 'autonomic', 2); }
  else if (q4 === 'B') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 3); addScore(scores, 'beauty', 2); addScore(scores, 'autonomic', 1); }
  else if (q4 === 'C') { addScore(scores, 'fatigue', 1); addScore(scores, 'performance', 1); }
  else if (q4 === 'E') { addScore(scores, 'fatigue', 1); addScore(scores, 'wakeup', 1); }

  // Q5
  const q5 = q(5);
  if (q5 === 'B') { addScore(scores, 'insomnia', 1); }
  else if (q5 === 'C') { addScore(scores, 'insomnia', 3); addScore(scores, 'autonomic', 1); }
  else if (q5 === 'D') { addScore(scores, 'insomnia', 4); addScore(scores, 'autonomic', 2); addScore(scores, 'performance', 1); }
  else if (q5 === 'E') { addScore(scores, 'insomnia', 4); addScore(scores, 'autonomic', 3); addScore(scores, 'performance', 2); }

  // Q6
  const q6 = q(6);
  if (q6 === 'B') { addScore(scores, 'wakeup', 1); }
  else if (q6 === 'C') { addScore(scores, 'wakeup', 3); addScore(scores, 'fatigue', 1); }
  else if (q6 === 'D') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 1); }
  else if (q6 === 'E') { addScore(scores, 'wakeup', 4); addScore(scores, 'insomnia', 2); addScore(scores, 'autonomic', 2); }

  // Q7
  const q7 = q(7);
  if (q7 === 'B') { addScore(scores, 'fatigue', 1); }
  else if (q7 === 'C') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); addScore(scores, 'beauty', 1); }
  else if (q7 === 'D') { addScore(scores, 'fatigue', 4); addScore(scores, 'wakeup', 2); addScore(scores, 'performance', 2); }
  else if (q7 === 'E') { addScore(scores, 'fatigue', 3); addScore(scores, 'autonomic', 3); addScore(scores, 'performance', 3); }

  // Q8
  const q8 = q(8);
  if (q8 === 'B') { addScore(scores, 'fatigue', 1); }
  else if (q8 === 'C') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); }
  else if (q8 === 'D') { addScore(scores, 'fatigue', 4); addScore(scores, 'performance', 4); }
  else if (q8 === 'E') { addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); addScore(scores, 'wakeup', 1); }

  // Q9
  const q9 = q(9);
  if (q9 === 'B') { addScore(scores, 'wakeup', 2); addScore(scores, 'fatigue', 1); }
  else if (q9 === 'C') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 3); addScore(scores, 'performance', 2); }
  else if (q9 === 'D') { addScore(scores, 'wakeup', 2); addScore(scores, 'fatigue', 1); }
  else if (q9 === 'E') { addScore(scores, 'wakeup', 1); }

  // Q10
  const q10 = q(10);
  if (q10 === 'B') { addScore(scores, 'insomnia', 1); }
  else if (q10 === 'C') { addScore(scores, 'insomnia', 3); addScore(scores, 'beauty', 1); addScore(scores, 'performance', 1); }
  else if (q10 === 'D') { addScore(scores, 'insomnia', 4); addScore(scores, 'beauty', 2); addScore(scores, 'performance', 2); }
  else if (q10 === 'E') { addScore(scores, 'insomnia', 4); addScore(scores, 'beauty', 2); addScore(scores, 'fatigue', 2); }

  // Q11
  const q11 = q(11);
  if (q11 === 'C') { addScore(scores, 'insomnia', 1); }
  else if (q11 === 'D') { addScore(scores, 'insomnia', 3); addScore(scores, 'wakeup', 1); }
  else if (q11 === 'E') { addScore(scores, 'insomnia', 4); addScore(scores, 'wakeup', 2); addScore(scores, 'performance', 1); }

  // Q12
  const q12 = q(12);
  if (q12 === 'B') { addScore(scores, 'wakeup', 1); }
  else if (q12 === 'C') { addScore(scores, 'wakeup', 2); addScore(scores, 'fatigue', 1); addScore(scores, 'beauty', 1); }
  else if (q12 === 'D') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 2); addScore(scores, 'beauty', 2); }
  else if (q12 === 'E') { addScore(scores, 'wakeup', 4); addScore(scores, 'insomnia', 2); addScore(scores, 'autonomic', 3); }

  // Q13
  const q13 = q(13);
  if (q13 === 'B') { addScore(scores, 'fatigue', 1); addScore(scores, 'autonomic', 1); addScore(scores, 'beauty', 1); }
  else if (q13 === 'C') { addScore(scores, 'insomnia', 1); addScore(scores, 'wakeup', 1); }
  else if (q13 === 'D') { addScore(scores, 'autonomic', 2); addScore(scores, 'wakeup', 1); addScore(scores, 'fatigue', 1); }
  else if (q13 === 'E') { addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 2); addScore(scores, 'beauty', 2); }

  // Q14
  const q14 = q(14);
  if (q14 === 'B') { addScore(scores, 'fatigue', 1); }
  else if (q14 === 'C') { addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 1); addScore(scores, 'beauty', 1); }
  else if (q14 === 'D') { addScore(scores, 'fatigue', 3); addScore(scores, 'autonomic', 2); addScore(scores, 'performance', 1); }
  else if (q14 === 'E') { addScore(scores, 'fatigue', 4); addScore(scores, 'performance', 3); addScore(scores, 'autonomic', 2); }

  // Q15
  const q15 = q(15);
  if (q15 === 'B') { addScore(scores, 'autonomic', 1); }
  else if (q15 === 'C') { addScore(scores, 'autonomic', 3); addScore(scores, 'insomnia', 2); addScore(scores, 'performance', 1); }
  else if (q15 === 'D') { addScore(scores, 'autonomic', 4); addScore(scores, 'insomnia', 3); addScore(scores, 'performance', 2); }
  else if (q15 === 'E') { addScore(scores, 'autonomic', 4); addScore(scores, 'insomnia', 4); addScore(scores, 'performance', 2); }

  // Q16
  const q16 = q(16);
  if (q16 === 'B') { addScore(scores, 'autonomic', 3); addScore(scores, 'fatigue', 1); }
  else if (q16 === 'C') { addScore(scores, 'fatigue', 2); addScore(scores, 'autonomic', 2); }
  else if (q16 === 'D') { addScore(scores, 'autonomic', 3); addScore(scores, 'performance', 2); }
  else if (q16 === 'E') { addScore(scores, 'autonomic', 4); addScore(scores, 'insomnia', 1); addScore(scores, 'wakeup', 1); }

  // Q17
  const q17 = q(17);
  if (q17 === 'B') { addScore(scores, 'beauty', 3); addScore(scores, 'fatigue', 1); }
  else if (q17 === 'C') { addScore(scores, 'beauty', 3); addScore(scores, 'fatigue', 1); }
  else if (q17 === 'D') { addScore(scores, 'beauty', 4); addScore(scores, 'wakeup', 1); }
  else if (q17 === 'E') { addScore(scores, 'beauty', 4); addScore(scores, 'fatigue', 2); }

  // Q18
  const q18 = q(18);
  if (q18 === 'B') { addScore(scores, 'performance', 1); }
  else if (q18 === 'C') { addScore(scores, 'performance', 3); addScore(scores, 'fatigue', 1); }
  else if (q18 === 'D') { addScore(scores, 'performance', 4); addScore(scores, 'fatigue', 2); }
  else if (q18 === 'E') { addScore(scores, 'performance', 4); addScore(scores, 'autonomic', 3); addScore(scores, 'fatigue', 1); }

  // Q19 correction
  const q19 = q(19);
  if (q19 === 'A') { addScore(scores, 'insomnia', 5); }
  else if (q19 === 'B') { addScore(scores, 'wakeup', 5); }
  else if (q19 === 'C') { addScore(scores, 'fatigue', 4); addScore(scores, 'wakeup', 2); }
  else if (q19 === 'D') { addScore(scores, 'fatigue', 5); }
  else if (q19 === 'E') { addScore(scores, 'beauty', 5); }
  else if (q19 === 'F') { addScore(scores, 'performance', 5); }
  else if (q19 === 'G') { addScore(scores, 'wakeup', 4); addScore(scores, 'fatigue', 2); }

  // Determine main and sub type
  const q19TypeKey = Q19_TYPE_MAP[q19];
  const sortedTypes = (Object.keys(scores) as SleepTypeKey[]).sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    // Tiebreak: Q19 type priority
    if (a === q19TypeKey) return -1;
    if (b === q19TypeKey) return 1;
    // Tiebreak: priority order
    return TYPE_PRIORITY.indexOf(a) - TYPE_PRIORITY.indexOf(b);
  });

  const mainTypeKey = sortedTypes[0];
  const subTypeKey = sortedTypes[1];

  // Zone
  let zone: string;
  let zoneColor: string;
  if (totalScore <= 15) {
    zone = '睡眠安定ゾーン';
    zoneColor = 'bg-teal-100 text-teal-700';
  } else if (totalScore <= 30) {
    zone = '睡眠見直しゾーン';
    zoneColor = 'bg-blue-100 text-blue-700';
  } else if (totalScore <= 45) {
    zone = '睡眠課題蓄積ゾーン';
    zoneColor = 'bg-amber-100 text-amber-700';
  } else {
    zone = '睡眠優先改善ゾーン';
    zoneColor = 'bg-red-100 text-red-700';
  }

  const sleepDeviation = Math.min(80, Math.max(20, 80 - totalScore));

  return {
    totalScore,
    sleepDeviation,
    zone,
    zoneColor,
    mainType: sleepTypes[mainTypeKey],
    subType: sleepTypes[subTypeKey],
    typeScores: scores,
    q20Answer: q(20),
    q1Answer: q(1),
    q2Answer: q(2),
  };
}
